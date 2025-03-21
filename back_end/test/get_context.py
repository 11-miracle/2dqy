import pymysql

from back_end.constant import HOST, USER, PASSWORD, DATABASE


def create_db():
    connection = pymysql.connect(host=HOST,
                                 port=3306,
                                 user=USER,
                                 password=PASSWORD,
                                 database=DATABASE,
                                 charset='utf8mb4', )
    cursor = connection.cursor()
    return cursor

def get_context():
    cursor = create_db()
    cursor.execute(f"""
    select * from context order by time LIMIT 10;
#     select * from context group by time DESC limit 10;
    """#
    )
    return cursor.fetchall()


print(get_context())