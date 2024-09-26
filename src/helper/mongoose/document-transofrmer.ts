export const MongooseDocumentTransformer: any = (doc: any) => {
  if (!doc) return null;

  const data: any = doc;
  const id: string = data._id.toString();
  delete data._id;
  return {
    id,
    ...data,
  };
};
