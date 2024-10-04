export const MongooseDocumentTransformer: (doc: any) => any = (
  doc: any,
): any => {
  if (!doc) return null;

  const response = {
    id: doc?._id?.toString(),
    ...doc._doc,
  };
  delete response?._id;
  return response;
};
