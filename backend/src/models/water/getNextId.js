async function getNextId(Model) {
  const last = await Model.findOne().sort({ _id: -1 }).select('_id').lean();
  return last ? last._id + 1 : 1;
}
module.exports = { getNextId };
