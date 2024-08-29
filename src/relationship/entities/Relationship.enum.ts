enum RelationshipStatus {
  REQUEST_USER_A = 'REQUEST_USER_A',
  REQUEST_USER_B = 'REQUEST_USER_B',
  FRIENDS = 'FRIENDS',
}

export default RelationshipStatus;

export function isRelationshipStatus(status: string): boolean {
  return Object.values(RelationshipStatus).includes(
    status as RelationshipStatus,
  );
}
