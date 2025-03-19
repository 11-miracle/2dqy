import json
import logging
import os
import uuid
from datetime import datetime
import chromadb
import requests
from PyPDF2 import PdfReader
from chromadb.api.types import IncludeEnum
from chromadb.utils.embedding_functions.openai_embedding_function import OpenAIEmbeddingFunction
from docx import Document
from openai import OpenAI


class Chatbot:
    def __init__(self):
        # 设置本地服务器地址
        self.client = OpenAI(base_url="http://192.168.105.5:8001/v1", api_key="lm_studio")
        self.messages = [
            {"role": "system", "content": "你是一个合格的 AI 助手，擅长中英文对话。请用简洁、友好的方式回答问题。"},
            {"role": "system", "content": "如果用户提出不合理或不安全的问题，请拒绝回答。"},
            {"role": "system", "content": "如果用户需要帮助，请提供清晰的指导。"}
            # {"role": "user", "content": "你是谁"}
        ]

    def chatbot(self, messages, query):

        messages = messages[-10:]
        messages.append({"role": "user", "content": query})
        response = self.client.chat.completions.create(
            model="qwen2.5-7b-instruct-mlx",
            messages=messages,
            temperature=0.7,
            stream=True,
            max_tokens=2048,
        )

        def generate_response():
            assistant_response = ""
            response_chunks = []
            chunk_id = 1

            for chunk in response:
                if chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    assistant_response += content
                    # print(content, end='')
                    response_chunks.append({"chunk_id": chunk_id, "content": content})
                    chunk_id += 1
                    # logging.info(content)
                    yield content  # 流式返回每个 chunk 的内容
            self.messages.append({"role": "user", "content": query})
            self.messages.append({"role": "user", "content": assistant_response})

            messages.append({"role": "user", "content": assistant_response})
            # 构造结构化输出
            structured_output = {
                "user_input": query,
                "model_response": assistant_response,
                "timestamp": datetime.utcnow().isoformat(),
                "messages": messages,
            }
            self.messages = messages
            logging.info(structured_output)
            # 在流式返回的最后，返回结构化输出
            yield f"{structured_output}"

        return generate_response()


# 文件处理函数
def process_file(filepath: str) -> str:
    ext = os.path.splitext(filepath)[1].lower()

    if ext == '.pdf':
        text = ""
        with open(filepath, 'rb') as f:
            reader = PdfReader(f)
            for page in reader.pages:
                text += page.extract_text()

    elif ext == '.docx':
        doc = Document(filepath)
        text = '\n'.join([para.text for para in doc.paragraphs])

    elif ext == '.txt':
        with open(filepath, 'r') as f:
            text = f.read()

    else:
        raise ValueError("Unsupported file format")

    return text


# 文本分块函数
def chunk_text(text: str, max_tokens: int = 3000) -> list[str]:
    words = text.split()
    chunks = []
    current_chunk = []

    for word in words:
        if len(current_chunk) + len(word) + 1 > max_tokens:  # +1 for space
            chunks.append(' '.join(current_chunk))
            current_chunk = []
        current_chunk.append(word)

    if current_chunk:
        chunks.append(' '.join(current_chunk))

    return chunks


# OpenAI 分析函数
def analyze_with_gpt(content: str, prompt: str) -> str:
    client = OpenAI(base_url="http://192.168.105.5:8001/v1", api_key="lm_studio")
    response = client.chat.completions.create(
        model="qwen2.5-7b-instruct-mlx",
        messages=[
            {"role": "system", "content": "你是一个专业文档分析助手"},
            {"role": "user", "content": f"{prompt}\n\n文档内容：{content}"}
        ],
        temperature=0.3
    )
    return response.choices[0].message.content


def embedding(text):
    url = "http://localhost:8001/v1/embeddings"
    payload = {
        "input": text,
        "model": 'text-embedding-nomic-embed-text-v1.5'
    }
    response = requests.post(url, json=payload)
    if response.status_code == 200:
        return response.json()["data"][0]["embedding"]
    else:
        raise Exception(f"Failed to get embedding: {response.status_code}, {response.text}")

openai_ef = OpenAIEmbeddingFunction(
                api_key="YOUR_API_KEY",
                model_name="text-embedding-nomic-embed-text-v1.5:2",
                api_base="http://192.168.105.5:8001/v1"
            )

def vector_db_add(texts):
    # 初始化向量数据库
    persist_directory = './vector/chroma1'  # 持久化数据  存放处
    client = chromadb.PersistentClient(persist_directory)
    collection = client.get_or_create_collection(name="test2", embedding_function=openai_ef)
    # 将文件添加到向量数据库中
    collection.add(
        documents=texts,
        metadatas=[{
            "source": "sample",
            "id": str(uuid.uuid4()),  # 生成唯一的 ID
            "timestamp": datetime.now().isoformat()  # 当前时间戳
        } for _ in texts],
        ids=[f"{uuid.uuid4()}{i}" for i in range(len(texts))]
    )
    logging.info('上传到向量数据库成功')



def search_in_vector_db(query):
    # 初始化向量数据库
    persist_directory = './vector/chroma1'  # 持久化数据存放处

    ector_db = chromadb
    client = chromadb.PersistentClient(persist_directory)
    collection = client.get_collection(name="test2",embedding_function=openai_ef)

    # 将查询文本转换为嵌入向量
    query_embedding = embedding(query)

    # 在向量数据库中搜索
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=2,
        # include=[IncludeEnum.documents, IncludeEnum.metadatas, IncludeEnum.distances]  # 使用 IncludeEnum 枚举
    )
    logging.info(f"搜索结果---------------{results}")

    # # 返回搜索结果
    # return {
    #     "ids": result_ids,
    #     "metadatas": result_metadatas,
    #     "distances": result_distances
    # }
