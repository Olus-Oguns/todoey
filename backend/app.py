from flask import Flask, request
from flask_restful import Resource, Api
from flask_cors import CORS
from pymongo import MongoClient
import uuid
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
api = Api(app)
CORS(app, resources={r"/tasks*": {"origins": "http://localhost:3000"}})

# Connect to MongoDB Atlas using environment variable
client = MongoClient(os.getenv('MONGO_URI'))
db = client['todoey_db']
tasks = db['tasks']

class TaskList(Resource):
    def get(self):
        return [
            {
                'id': str(task['_id']),
                'task': task['task'],
                'category': task.get('category', 'general'),
                'dueDateTime': task.get('dueDateTime', ''),
                'isImportant': task.get('isImportant', False),
                'completed': task.get('completed', False),
                'items': task.get('items', [])
            } for task in tasks.find()
        ], 200

    def post(self):
        data = request.get_json()
        if not data.get('task'):
            return {'message': 'Task is required'}, 400
        task_id = str(uuid.uuid4())
        task = {
            '_id': task_id,
            'task': data['task'],
            'category': data.get('category', 'general'),
            'dueDateTime': data.get('dueDateTime', ''),
            'isImportant': data.get('isImportant', False),
            'completed': data.get('completed', False),
            'items': data.get('items', [])
        }
        tasks.insert_one(task)
        return {
            'id': task_id,
            'task': task['task'],
            'category': task['category'],
            'dueDateTime': task['dueDateTime'],
            'isImportant': task['isImportant'],
            'completed': task['completed'],
            'items': task['items']
        }, 201

class Task(Resource):
    def get(self, task_id):
        task = tasks.find_one({'_id': task_id})
        if task:
            return {
                'id': str(task['_id']),
                'task': task['task'],
                'category': task.get('category', 'general'),
                'dueDateTime': task.get('dueDateTime', ''),
                'isImportant': task.get('isImportant', False),
                'completed': task.get('completed', False),
                'items': task.get('items', [])
            }, 200
        return {'message': 'Task not found'}, 404

    def put(self, task_id):
        data = request.get_json()
        if not data.get('task'):
            return {'message': 'Task is required'}, 400
        update_data = {
            'task': data['task'],
            'category': data.get('category', 'general'),
            'dueDateTime': data.get('dueDateTime', ''),
            'isImportant': data.get('isImportant', False),
            'completed': data.get('completed', False),
            'items': data.get('items', [])
        }
        result = tasks.update_one({'_id': task_id}, {'$set': update_data})
        if result.matched_count:
            return {'message': 'Task updated'}, 200
        return {'message': 'Task not found'}, 404

    def delete(self, task_id):
        result = tasks.delete_one({'_id': task_id})
        if result.deleted_count:
            return {'message': 'Task deleted'}, 200
        return {'message': 'Task not found'}, 404

api.add_resource(TaskList, '/tasks')
api.add_resource(Task, '/tasks/<string:task_id>')

if __name__ == '__main__':
    app.run(debug=True)