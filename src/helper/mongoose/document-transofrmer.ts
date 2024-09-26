export const MongooseDocumentTransformer: any = (doc: any) => {
  if (!doc) return null;

  if ('id' in doc || !('_id' in doc)) return doc;

  let response = {
    id: doc._id.toString(),
    ...doc,
  };
  delete response._id;
  return response;
};
