import { GraphQLFloat, GraphQLList, GraphQLObjectType } from 'graphql';
import { GraphQLString } from 'graphql/index.js';
import { UUIDType } from '../types/uuid.js';
import { PrismaClient } from '@prisma/client';
// import { User } from '@prisma/client';
import * as runtime from '@prisma/client';
const prisma = new PrismaClient();

export const User = new GraphQLObjectType({
  name: 'User',
  fields: () => ({
    id: {
      type: UUIDType,
    },
    name: {
      type: GraphQLString,
    },
    balance: {
      type: GraphQLFloat,
    },
    userSubscribedTo: {
      type: new GraphQLList(User),
      resolve: (user: runtime.User ) => {
        return prisma.user.findMany({
          where: {
            userSubscribedTo: {
              some: {
                authorId: user.id,
              },
            },
          },
        });
      },
    },
  }),
});