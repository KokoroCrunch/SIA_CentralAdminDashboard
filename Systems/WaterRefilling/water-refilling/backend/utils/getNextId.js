// Auto-increment integer _id helper.
// Finds the current max _id in the collection and returns max + 1.
async function getNextId(Model) {
  const last = await Model.findOne().sort({ _id: -1 }).select('_id').lean();
  return last ? last._id + 1 : 1;
}

module.exports = { getNextId };
