import logging
import os
import uuid

from PyPDF2 import PdfReader
from docx import Document
from openai import OpenAI
from starlette.responses import StreamingResponse, JSONResponse

from lanny_tools import Chatbot, process_file, chunk_text, analyze_with_gpt, embedding
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from starlette.middleware.cors import CORSMiddleware

app = FastAPI()
# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有来源，生产环境应指定具体域名
    allow_credentials=True,
    allow_methods=["*"],  # 允许所有方法
    allow_headers=["*"],  # 允许所有头
)
# 在FastAPI应用启动前添加日志配置
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
messages = [
    # {"role": "system", "content": "你是专业的厨师，只能回答与做饭相关的问题。如果用户问到了其他问题，请拒绝回答。并返回'error"},
    {"role": "system", "content": "你是一个优秀的ai聊天助手，擅长中英文对话。请用简洁、友好的方式回答问题。"},
    {"role": "system", "content": "如果用户提出不合理或不安全的问题，请拒绝回答。"},
    {"role": "system", "content": "如果用户需要帮助，请提供清晰的指导。"}
]


@app.get("/")
async def root():
    return {"message": "Hello World, I'm a chatbot🤖"}


@app.get("/test")
async def root(question: str):
    return {"message": f"{question}\n hello,I don't know✈️🚄"}


@app.get("/test/{name}")
async def say_hello(name: str):
    return {"message": f"Hello {name}"}


@app.get("/chatbot")
async def say_hello(query: str = None):
    if query is None:
        return {"message": "Hello, World!"}
    logging.debug(f"Received name: {query}")

    # messages = [
    #     # {"role": "system", "content": "你是专业的厨师，只能回答与做饭相关的问题。如果用户问到了其他问题，请拒绝回答。并返回'error"},
    #     {"role": "system", "content": "你是一个优秀的ai聊天助手，擅长中英文对话。请用简洁、友好的方式回答问题。"},
    #     {"role": "system", "content": "如果用户提出不合理或不安全的问题，请拒绝回答。"},
    #     {"role": "system", "content": "如果用户需要帮助，请提供清晰的指导。"}
    # ]
    chatbot = Chatbot()
    res = chatbot.chatbot(messages, query)

    # 创建一个异步生成器来处理流式响应
    return StreamingResponse(res, media_type="application/json")


# API 路由
@app.post("/analyze")
async def upload(

        file: UploadFile = File(...),  # 上传的文件
        # query: str = Form("请总结这个文档")  # 用户问题，默认为总结文档
):
    # 文件上传目录
    UPLOAD_FOLDER = 'uploads'
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    logging.info(f"Received file: {file.filename}")
    filetype = file.filename.split('.')[-1]

    # 保存文件
    file_id = str(uuid.uuid4())
    filepath = os.path.join(UPLOAD_FOLDER, file_id + f'.{filetype}')
    logging.info(f"Received file: {filepath}")
    with open(filepath, 'wb') as f:
        f.write(await file.read())

    try:
        # 提取文本
        text = process_file(filepath)
        chunks = chunk_text(text)

        # # 分段处理
        # responses = []
        # for chunk in chunks:
        #     response = analyze_with_gpt(chunk, query)
        #     responses.append(response)

        # 最终汇总
        # final_response = analyze_with_gpt('\n'.join(responses), "请整合以下分析结果")

        # return JSONResponse({
        #     "status": "success",
        #     "result": final_response
        # })
        logging.info(chunks)
        embedding_text = embedding(chunks)
        logging.info(embedding_text)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # 清理临时文件
        if os.path.exists(filepath):
            os.remove(filepath)
