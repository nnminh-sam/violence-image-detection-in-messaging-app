enum RelationshipStatus {
  REQUEST_USER_A = 'REQUEST_USER_A',
  REQUEST_USER_B = 'REQUEST_USER_B',
  FRIENDS = 'FRIENDS',
  BLOCKED_USER_A = 'BLOCKED_USER_A',
  BLOCKED_USER_B = 'BLOCKED_USER_B',
}

export default RelationshipStatus;

export function isRelationshipStatus(status: string): boolean {
  return Object.values(RelationshipStatus).includes(
    status as RelationshipStatus,
  );
}
