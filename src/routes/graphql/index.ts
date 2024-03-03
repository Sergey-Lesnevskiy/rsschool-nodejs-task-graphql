// import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
// import { createGqlResponseSchema, gqlResponseSchema } from './schemas.js';
// import { GraphQLFloat, GraphQLList, GraphQLObjectType, GraphQLSchema, GraphQLString, Source, graphql, validate , parse, GraphQLNonNull, GraphQLBoolean, GraphQLInt} from 'graphql';
// // import { User } from './user/user.js';
// import { Post } from './posts/post.js';
// // import { Profile } from './profile/profile.js';
// // import { MemberType } from './memberTypes/memberTypes.js';
// import { UUIDType } from './types/uuid.js';
// // import { User } from '@prisma/client';
// import { UUID } from 'crypto';
// import depthLimit from 'graphql-depth-limit';
// import { MemberTypeId } from '../member-types/schemas.js';
// // import { User } from './user/user.js';
// // import { MemberTypeId } from '../member-types/schemas.js';
// import { MemberType } from './types/member-type.js';
// // import { MyMemberTypeId } from './memberTypes/memberTypeId.js';
// import { CreateProfileInput } from './create/profileInput.js';
// import { CreatePostInput } from './create/postInput.js';
// import { CreateUserInput } from './create/userInput.js';
// import { Profile, User } from '@prisma/client';
// import { MemberTypeId as GraphQLMemberTypeId } from './types/member-type-id.js';
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
// import { MemberType } from './types/member-type.js';
import { MemberType } from './types/memberType.js';
import { UUIDType } from './types/uuid.js';
import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLInt,
  GraphQLString,
} from 'graphql/index.js';
// import { User } from '@prisma/client';
import depthLimit from 'graphql-depth-limit';
import { MemberTypeId as GraphQLMemberTypeId } from './types/memberTypeId.js';
import { MemberTypeId } from '../member-types/schemas.js';
import { CreateUserInput } from './types/create-user-input.js';
import { CreatePostInput } from './types/create-post-input.js';
import { CreateProfileInput } from './types/create-profile-input.js';
import { Profile, User } from '@prisma/client';


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
// import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
// import { createGqlResponseSchema, gqlResponseSchema } from './schemas.js';
// import {
//   graphql,
//   GraphQLList,
//   GraphQLNonNull,
//   GraphQLObjectType,
//   GraphQLSchema,
//   parse,
//   Source,
//   validate,
// } from 'graphql';
// import { Post } from './posts/post.js'
// import { MemberType } from './types/member-type.js';
// import { UUID } from 'crypto';
// import { UUIDType } from './types2/uuid.js';
// import {
//   GraphQLBoolean,
//   GraphQLFloat,
//   GraphQLInt,
//   GraphQLString,
// } from 'graphql/index.js';
// import { User } from '@prisma/client';
// import depthLimit from 'graphql-depth-limit';
// import { MemberTypeId as GraphQLMemberTypeId } from './types/member-type-id.js';
// import { MemberTypeId } from '../member-types/schemas.js';
// import { CreateUserInput } from './types/create-user-input.js';
// import { CreatePostInput } from './types/create-post-input.js';
// import { CreateProfileInput } from './types/create-profile-input.js';
// import { Profile} from './profile/profile.js';

// const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
//   const { prisma } = fastify;
  // const Profile = new GraphQLObjectType({
  //   name: 'Profile',
  //   fields: () => ({
  //     id: {
  //       type: UUIDType,
  //     },
  //     isMale: {
  //       type: GraphQLBoolean,
  //     },
  //     yearOfBirth: {
  //       type: GraphQLInt,
  //     },
  //     memberType: {
  //       type: MemberType,
  //       resolve: (profile: Profile) => {
  //         return prisma.memberType.findUnique({
  //           where: {
  //             id: profile.memberTypeId,
  //           },
  //         });
  //       },
  //     },
  //   }),
  // });
//   const User = new GraphQLObjectType({
//     name: 'User',
//     fields: () => ({
//       id: {
//         type: UUIDType,
//       },
//       name: {
//         type: GraphQLString,
//       },
//       balance: {
//         type: GraphQLFloat,
//       },
//       userSubscribedTo: {
//         type: new GraphQLList(User),
//         resolve: (user: User) => {
//           return prisma.user.findMany({
//             where: {
//               subscribedToUser: {
//                 some: {
//                   subscriberId: user.id,
//                 },
//               },
//             },
//           });
//         },
//       },
//       subscribedToUser: {
//         type: new GraphQLList(User),
//         resolve: (user: User) => {
//           return prisma.user.findMany({
//             where: {
//               userSubscribedTo: {
//                 some: {
//                   authorId: user.id,
//                 },
//               },
//             },
//           });
//         },
//       },
//       profile: {
//         type: Profile,
//         resolve: (user: User) => {
//           return prisma.profile.findUnique({
//             where: {
//               userId: user.id,
//             },
//           });
//         },
//       },
//       posts: {
//         type: new GraphQLList(Post),
//         resolve: (user: User) => {
//           return prisma.post.findMany({
//             where: {
//               authorId: user.id,
//             },
//           });
//         },
//       },
//     }),
//   });
//   fastify.route({
//     url: '/',
//     method: 'POST',
//     schema: {
//       ...createGqlResponseSchema,
//       response: {
//         200: gqlResponseSchema,
//       },
//     },

//     async handler(req) {
//       const source = new Source(req.body.query);
//       const schema = new GraphQLSchema({
//         query: new GraphQLObjectType({
//           name: 'Query',
//           fields: () => ({
//             users: {
//               type: new GraphQLList(User),
//               resolve: () => {
//                 return prisma.user.findMany();
//               },
//             },
//             posts: {
//               type: new GraphQLList(Post),
//               resolve: () => {
//                 return prisma.post.findMany();
//               },
//             },
//             profiles: {
//               type: new GraphQLList(Profile),
//               resolve: () => {
//                 return prisma.profile.findMany();
//               },
//             },
//             memberTypes: {
//               type: new GraphQLList(MemberType),
//               resolve: () => {
//                 return prisma.memberType.findMany();
//               },
//             },
//             user: {
//               type: User as GraphQLObjectType,
//               args: {
//                 id: {
//                   type: new GraphQLNonNull(UUIDType),
//                 },
//               },
//               resolve: (_source, { id }: { id: UUID }) => {
//                 return prisma.user.findUnique({
//                   where: { id },
//                 });
//               },
//             },
//             memberType: {
//               type: MemberType,
//               args: {
//                 id: {
//                   type: new GraphQLNonNull(GraphQLMemberTypeId),
//                 },
//               },
//               resolve: (_source, { id }: { id: MemberTypeId }) => {
//                 return prisma.memberType.findUnique({
//                   where: { id },
//                 });
//               },
//             },
//             post: {
//               type: Post,
//               args: {
//                 id: {
//                   type: new GraphQLNonNull(UUIDType),
//                 },
//               },
//               resolve: (_source, { id }: { id: UUID }) => {
//                 return prisma.post.findUnique({
//                   where: { id },
//                 });
//               },
//             },
//             profile: {
//               type: Profile,
//               args: {
//                 id: {
//                   type: new GraphQLNonNull(UUIDType),
//                 },
//               },
//               resolve: (_source, { id }: { id: UUID }) => {
//                 return prisma.profile.findUnique({
//                   where: { id },
//                 });
//               },
//             },
//           }),
//         }),

//         mutation: new GraphQLObjectType({
//           name: 'Mutation',
//           fields: () => ({
//             createUser: {
//               type: User as GraphQLObjectType,
//               args: {
//                 dto: {
//                   type: new GraphQLNonNull(CreateUserInput),
//                 },
//               },
//               resolve: (_, { dto }: { dto: { name: string; balance: number } }) => {
//                 return prisma.user.create({
//                   data: dto,
//                 });
//               },
//             },

//             createPost: {
//               type: Post,
//               args: {
//                 dto: {
//                   type: new GraphQLNonNull(CreatePostInput),
//                 },
//               },
//               resolve: (
//                 _,
//                 { dto }: { dto: { authorId: string; content: UUID; title: UUID } },
//               ) => {
//                 return prisma.post.create({
//                   data: dto,
//                 });
//               },
//             },

//             createProfile: {
//               type: Profile,
//               args: {
//                 dto: {
//                   type: new GraphQLNonNull(CreateProfileInput),
//                 },
//               },
//               resolve: (
//                 _,
//                 {
//                   dto,
//                 }: {
//                   dto: {
//                     userId: string;
//                     isMale: boolean;
//                     memberTypeId: MemberTypeId;
//                     yearOfBirth: number;
//                   };
//                 },
//               ) => {
//                 return prisma.profile.create({
//                   data: dto,
//                 });
//               },
//             },
//           }),
//         }),
//       });

//       const errors = validate(schema, parse(source), [depthLimit(5)]);
//       if (errors.length) {
//         return {
//           errors,
//         };
//       }
//       return graphql({
//         schema: schema,
//         source: source,
//         variableValues: req.body.variables,
//         contextValue: { prisma },
//       });
//     },
//   });
// };
// export default plugin;