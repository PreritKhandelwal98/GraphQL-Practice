const express = require('express');
const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require('@apollo/server/express4');
const bodyParser = require('body-parser');
const cors = require('cors');
const { default: axios } = require('axios');

async function startServer() {
    const app = express();
    const server = new ApolloServer({
        typeDefs: `
            type User {
                id:ID!
                name:String
                email:String
            }
           type Todo {
                id: ID!
                title: String!
                completed: Boolean
                user:User
            }

            type Query {
                getTodos: [Todo!]!
                getAllUsers:[User]!
                getUserById(id:ID!):User
            }
        `,
        resolvers: {
            Todo: {
                user: async (todo) => (await axios.get(`https://jsonplaceholder.typicode.com/users/${todo.id}`)).data
            },
            Query: {
                getTodos: async () => (await axios.get('https://jsonplaceholder.typicode.com/todos')).data,
                getAllUsers: async () => (await axios.get('https://jsonplaceholder.typicode.com/todos')).data,
                getUserById: async (parent, { id }) => (await axios.get(`https://jsonplaceholder.typicode.com/users/${id}`)).data

            }
        }
    });

    app.use(bodyParser.json());
    app.use(cors());

    await server.start();

    app.use('/graphql', expressMiddleware(server)); // Note the '/' in '/graphql'

    app.listen(8000, () => console.log(`Server is started at PORT: 8000`));
}

startServer();
