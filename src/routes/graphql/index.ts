import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { createGqlResponseSchema, gqlResponseSchema } from './schemas.js';
import { GraphQLFloat, GraphQLList, GraphQLObjectType, GraphQLSchema, GraphQLString, Source, graphql, validate , parse, GraphQLNonNull} from 'graphql';
// import { User } from './user/user.js';
import { Post } from './posts/post.js';
import { ProfileI } from './profile/profile.js';
import { MemberType } from './memberTypes/memberTypes.js';
import { UUIDType } from './types/uuid.js';
// import { User } from '@prisma/client';
import { UUID } from 'crypto';
import depthLimit from 'graphql-depth-limit';
import { UserI } from './user/user.js';
import { MemberTypeId } from '../member-types/schemas.js';
import { MyMemberTypeId } from './memberTypes/memberTypeId.js';


const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  const { prisma } = fastify;

  fastify.route({
    url: '/',
    method: 'POST',
    schema: {
      ...createGqlResponseSchema,
      response: {
        200: gqlResponseSchema,
      },
    },
    async handler(req) {
      const source = new Source(req.body.query);
      const schema = new GraphQLSchema({
        query: new GraphQLObjectType({
          name: 'Query',
          fields: () => ({
            users: {
              type: new GraphQLList(UserI),
              resolve: () => {
                return prisma.user.findMany();
              },
            },
            posts: {
              type: new GraphQLList(Post),
              resolve: () => {
                return prisma.post.findMany();
              },
            },
            profiles: {
              type: new GraphQLList(ProfileI),
              resolve: () => {
                return prisma.profile.findMany();
              },
            },
            memberTypes: {
              type: new GraphQLList(MemberType),
              resolve: () => {
                return prisma.memberType.findMany();
              },
            },

            user: {
              type: UserI as GraphQLObjectType,
              args: {
                id: {
                  type: new GraphQLNonNull(UUIDType),
                },
              },
              resolve: (_source, { id }: { id: UUID }) => {
                return prisma.user.findUnique({
                  where: { id },
                });
              },
            },

            memberType: {
              type: MemberType,
              args: {
                id: {
                  type: new GraphQLNonNull(MyMemberTypeId),
                },
              },
              resolve: (_source, { id }: { id: MemberTypeId }) => {
                return prisma.memberType.findUnique({
                  where: { id },
                });
              },
            },

            post: {
              type: Post,
              args: {
                id: {
                  type: new GraphQLNonNull(UUIDType),
                },
              },
              resolve: (_source, { id }: { id: UUID }) => {
                return prisma.post.findUnique({
                  where: { id },
                });
              },
            },

            profile: {
              type: ProfileI,
              args: {
                id: {
                  type: new GraphQLNonNull(UUIDType),
                },
              },
              resolve: (_source, { id }: { id: UUID }) => {
                return prisma.profile.findUnique({
                  where: { id },
                });
              },
            },
          }),
        }),
      });

      const errors = validate(schema, parse(source), [depthLimit(5)]);
      if (errors.length) {
        return {
          errors,
        };
      }

      return graphql({
        schema: schema,
        source: source,
        variableValues: req.body.variables,
        contextValue: { prisma },
      });
    },
  });
};
export default plugin;
