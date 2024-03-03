import { GraphQLFloat, GraphQLInt, GraphQLObjectType } from 'graphql';
import { GraphQLString } from 'graphql/index.js';
import { MyMemberTypeId } from './memberTypeId.js';

export const MemberType = new GraphQLObjectType({
  name: 'MemberType',
  fields: () => ({
    id: {
      type: MyMemberTypeId,
    },
    discount: {
      type: GraphQLFloat,
    },
    postsLimitPerMonth: {
      type: GraphQLInt,
    },
  }),
});