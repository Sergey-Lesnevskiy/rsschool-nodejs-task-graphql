import { GraphQLBoolean, GraphQLInt, GraphQLObjectType } from 'graphql';
import { UUIDType } from '../types/uuid.js';
import { PrismaClient } from '@prisma/client';
import { Profile } from '@prisma/client';
import { MemberType } from '../memberTypes/memberTypes.js';
const prisma = new PrismaClient();

export const ProfileI = new GraphQLObjectType({
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