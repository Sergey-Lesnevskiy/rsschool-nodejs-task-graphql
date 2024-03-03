import { GraphQLFloat, GraphQLList, GraphQLObjectType } from 'graphql';
import { GraphQLString } from 'graphql/index.js';
import { UUIDType } from '../types/uuid.js';
import { PrismaClient } from '@prisma/client';
import { User } from '@prisma/client';
const prisma = new PrismaClient();

export const UserI = new GraphQLObjectType({
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
      type: new GraphQLList(UserI),
      resolve: (user: User) => {
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