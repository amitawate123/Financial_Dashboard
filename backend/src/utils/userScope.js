/** Every user only sees and manages their own transactions. */
const ownerFilter = (user) => ({ createdBy: user._id });

const stripOwnershipFields = (data = {}) => {
  const {
    createdBy,
    isDeleted,
    _id,
    __v,
    attachments,
    createdAt,
    updatedAt,
    ...safe
  } = data;
  return safe;
};

module.exports = { ownerFilter, stripOwnershipFields };
