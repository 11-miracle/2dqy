from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import CharacterTextSplitter


raw_documents = TextLoader('/Users/2dqy004/Downloads/21.html').load()  # ,encoding='gbk'
# 创建一个文本分割器，chunks代表分成多少块  chunk_overlap 确保相邻片段之间有一定的重叠部分
text_splitter = CharacterTextSplitter(chunk_size=3000, chunk_overlap=50)
# 使用文本分割器，将原始文档分割成多个片段   documents是一个列表
documents = text_splitter.split_documents(raw_documents)
print(documents)
# for i in documents:
#     print(i)