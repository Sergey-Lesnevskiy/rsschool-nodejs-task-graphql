import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { createGqlResponseSchema, gqlResponseSchema } from './schemas.js';
import {
  graphql,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  parse,
  Source,
  validate,
} from 'graphql';
import { Post } from './posts/post.js';
import { UUID } from 'crypto';
import { MemberType } from './types/memberType.js';
import { UUIDType } from './types/uuid.js';
import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLInt,
  GraphQLString,
} from 'graphql/index.js';
import depthLimit from 'graphql-depth-limit';
import { MemberTypeId as GraphQLMemberTypeId } from './types/memberTypeId.js';
import { MemberTypeId } from '../member-types/schemas.js';
import { CreateUserInput } from './types/createUser.js';
import { CreatePostInput } from './types/createPost.js';
import { CreateProfileInput } from './types/createProfile.js';
import { Profile, User } from '@prisma/client';
import { ChangeProfileInput } from './types/changeProfile.js';
import { ChangeUserInput } from './types/changeUser.js';
import { ChangePostInput } from './types/changePost.js';


const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
    const { prisma } = fastify;
    const Profile = new GraphQLObjectType({
      name: 'Profile',
      fields: () => ({
        id: {
          type: UUIDType,
        },
        isMale: {
          type: GraphQLBoolean,
        },
        yearOfBirth: {
          type: GraphQLInt,
        },
        memberType: {
          type: MemberType,
          resolve: (profile: Profile) => {
            return prisma.memberType.findUnique({
              where: {
                id: profile.memberTypeId,
              },
            });
          },
        },
      }),
    });
    const User = new GraphQLObjectType({
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
          resolve: (user: User) => {
            return prisma.user.findMany({
              where: {
                subscribedToUser: {
                  some: {
                    subscriberId: user.id,
                  },
                },
              },
            });
          },
        },
        subscribedToUser: {
          type: new GraphQLList(User),
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
        profile: {
          type: Profile,
          resolve: (user: User) => {
            return prisma.profile.findUnique({
              where: {
                userId: user.id,
              },
            });
          },
        },
        posts: {
          type: new GraphQLList(Post),
          resolve: (user: User) => {
            return prisma.post.findMany({
              where: {
                authorId: user.id,
              },
            });
          },
        },
      }),
    });
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
                type: new GraphQLList(User),
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
                type: new GraphQLList(Profile),
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
                type: User as GraphQLObjectType,
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
                    type: new GraphQLNonNull(GraphQLMemberTypeId),
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
                type: Profile,
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
  
          mutation: new GraphQLObjectType({
            name: 'Mutation',
            fields: () => ({
              createUser: {
                type: User as GraphQLObjectType,
                args: {
                  dto: {
                    type: new GraphQLNonNull(CreateUserInput),
                  },
                },
                resolve: (_, { dto }: { dto: { name: string; balance: number } }) => {
                  return prisma.user.create({
                    data: dto,
                  });
                },
              },
  
              createPost: {
                type: Post,
                args: {
                  dto: {
                    type: new GraphQLNonNull(CreatePostInput),
                  },
                },
                resolve: (
                  _,
                  { dto }: { dto: { authorId: string; content: UUID; title: UUID } },
                ) => {
                  return prisma.post.create({
                    data: dto,
                  });
                },
              },
  
              createProfile: {
                type: Profile,
                args: {
                  dto: {
                    type: new GraphQLNonNull(CreateProfileInput),
                  },
                },
                resolve: (
                  _,
                  {
                    dto,
                  }: {
                    dto: {
                      userId: string;
                      isMale: boolean;
                      memberTypeId: MemberTypeId;
                      yearOfBirth: number;
                    };
                  },
                ) => {
                  return prisma.profile.create({
                    data: dto,
                  });
                },
              },
              deleteUser: {
                type: GraphQLBoolean,
                args: {
                  id: {
                    type: new GraphQLNonNull(UUIDType),
                  },
                },
  
                resolve: async (_, { id }: { id: UUID }) => {
                  return !!(await prisma.user.delete({
                    where: { id },
                  }));
                },
              },
  
              deletePost: {
                type: GraphQLBoolean,
                args: {
                  id: {
                    type: new GraphQLNonNull(UUIDType),
                  },
                },
  
                resolve: async (_, { id }: { id: UUID }) => {
                  return !!(await prisma.post.delete({
                    where: { id },
                  }));
                },
              },
  
              deleteProfile: {
                type: GraphQLBoolean,
                args: {
                  id: {
                    type: new GraphQLNonNull(UUIDType),
                  },
                },
  
                resolve: async (_, { id }: { id: UUID }) => {
                  return !!(await prisma.profile.delete({
                    where: { id },
                  }));
                },
              },

            changeUser: {
              type: User as GraphQLObjectType,
              args: {
                id: {
                  type: new GraphQLNonNull(UUIDType),
                },
                dto: {
                  type: new GraphQLNonNull(ChangeUserInput),
                },
              },

              resolve: (_, { id, dto }: { id: UUID; dto: { name: string } }) => {
                return prisma.user.update({
                  where: { id },
                  data: dto,
                });
              },
            },

            changePost: {
              type: Post,
              args: {
                id: {
                  type: new GraphQLNonNull(UUIDType),
                },
                dto: {
                  type: new GraphQLNonNull(ChangePostInput),
                },
              },

              resolve: (_, { id, dto }: { id: UUID; dto: { title: string } }) => {
                return prisma.post.update({
                  where: { id },
                  data: dto,
                });
              },
            },

            changeProfile: {
              type: Profile,
              args: {
                id: {
                  type: new GraphQLNonNull(UUIDType),
                },
                dto: {
                  type: new GraphQLNonNull(ChangeProfileInput),
                },
              },

              resolve: (_, { id, dto }: { id: UUID; dto: { isMale: boolean } }) => {
                return prisma.profile.update({
                  where: { id },
                  data: dto,
                });
              },
            },
            subscribeTo: {
              type: User as GraphQLObjectType,
              args: {
                userId: {
                  type: new GraphQLNonNull(UUIDType),
                },
                authorId: {
                  type: new GraphQLNonNull(UUIDType),
                },
              },

              resolve: (_, { userId, authorId }: { userId: UUID; authorId: UUID }) => {
                return prisma.user.update({
                  where: {
                    id: userId,
                  },
                  data: {
                    userSubscribedTo: {
                      create: {
                        authorId,
                      },
                    },
                  },
                });
              },
            },

            unsubscribeFrom: {
              type: GraphQLBoolean,
              args: {
                userId: {
                  type: new GraphQLNonNull(UUIDType),
                },
                authorId: {
                  type: new GraphQLNonNull(UUIDType),
                },
              },

              resolve: async (
                _,
                { userId, authorId }: { userId: UUID; authorId: UUID },
              ) => {
                return !!(await prisma.subscribersOnAuthors.delete({
                  where: {
                    subscriberId_authorId: {
                      subscriberId: userId,
                      authorId,
                    },
                  },
                }));
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
