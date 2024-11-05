const express = require('express');
const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require('@apollo/server/express4');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

mongoose.connect(process.env.MONGODB_URL);

const TodoSchema = new mongoose.Schema({
    title: String,
    completed: Boolean,
    userId: mongoose.Schema.Types.ObjectId,
});

const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
});

const Todo = mongoose.model('Todo', TodoSchema);
const User = mongoose.model('User', UserSchema);

async function startServer() {
    const app = express();
    const server = new ApolloServer({
        typeDefs: `
            type User {
                id: ID!
                name: String
                email: String
            }
           type Todo {
                id: ID!
                title: String!
                completed: Boolean
                user: User
            }

            type Query {
                getTodos: [Todo!]!
                getAllUsers: [User!]!
                getUserById(id: ID!): User
            }

            type Mutation {
                createTodo(title: String!, completed: Boolean, userId: ID!): Todo!
                createUser(name: String!, email: String!): User!
                updateTodo(id: ID!, title: String, completed: Boolean): Todo
                deleteTodo(id: ID!): Boolean
            }
        `,
        resolvers: {
            Todo: {
                user: async (todo) => await User.findById(todo.userId),
            },
            Query: {
                getTodos: async () => await Todo.find(),
                getAllUsers: async () => await User.find(),
                getUserById: async (parent, { id }) => await User.findById(id),
            },
            Mutation: {
                createTodo: async (parent, { title, completed, userId }) => {
                    const todo = new Todo({
                        title,
                        completed,
                        userId,
                    });
                    return await todo.save();
                },
                createUser: async (parent, { name, email }) => {
                    const user = new User({ name, email });
                    return await user.save();
                },
                updateTodo: async (parent, { id, title, completed }) => {
                    return await Todo.findByIdAndUpdate(id, { title, completed }, { new: true });
                },
                deleteTodo: async (parent, { id }) => {
                    const result = await Todo.findByIdAndDelete(id);
                    return !!result;
                },
            },
        },
    });

    app.use(bodyParser.json());
    app.use(cors());

    await server.start();

    app.use('/graphql', expressMiddleware(server));

    app.listen(8000, () => console.log(`Server is started at PORT: 8000`));
}

startServer();
