export const MongooseDocumentTransformer: any = (doc: any) => {
  if (!doc) return null;

  if ('id' in doc || !('_id' in doc)) return doc;

  console.log('doc:', doc);

  let response = {
    id: doc._id.toString(),
    ...doc,
  };
  delete response._id;
  return response;

  // const data = doc;
  // const id = data._id.toString();
  // delete data._id;
  // return {
  //   id: id,
  //   ...data,
  // };
};
