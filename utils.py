# #Presigned URL + JWT helpers
# import jwt
# from datetime import datetime, timedelta
# import uuid
# import redis
# import json
# import boto3

# def generate_presigned_s3_url(bucket_name, object_path, expires_in=3600):
#     if bucket_name is None:
#         return f"https://fake-storage.com/{object_path}?expires_in={expires_in}"
    
#     s3_client = boto3.client('s3')
#     return s3_client.generate_presigned_url(
#         ClientMethod='put_object',
#         Params={'Bucket': bucket_name, 'Key': object_path},
#         ExpiresIn=expires_in
#     )

# SECRET_KEY = "secretkey123"
# ALGORITHM = "HS256"

# def create_jwt_token(data: dict, expires_delta: timedelta = timedelta(hours=1)):
#     to_encode = data.copy()
#     expire = datetime.utcnow() + expires_delta
#     to_encode.update({"exp": expire})
#     token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
#     return token

# def create_task_id():
#     return str(uuid.uuid4())

# #Push task to queue:
# r = redis.Redis(host='localhost', port=6379, db=0)

# def push_task_to_queue(task_id: str,object_path:str,user_id:str):
#     task = {
#             "task_id": task_id,
#             "object_path": object_path,
#             "user_id": user_id,
#             "status": "pending", #pending/processing/done
#             "created_at": datetime.utcnow().isoformat()
#         }
#     r.rpush("task_queue", json.dumps(task))   

# def get_queue_position(task_id:str)->int:
#     queue=r.lrange("task_queue",0,-1)
#     for i, t in enumerate(queue):
#         task=json.loads(t)
#         if task.get("task_id")==task_id:
#             return i+1
#     return -1

# def update_task_status(task_id: str, status: str):
#     queue = r.lrange("task_queue", 0, -1)
#     for i, t in enumerate(queue):
#         task = json.loads(t)
#         if task.get("task_id") == task_id:
#             task["status"] = status
#             r.lset("task_queue", i, json.dumps(task))
#             return True
#     return False