/**
 * generator function to help us auto increment unique ids.
 */
const idGenerator = function* () {
  let id = 0;

  while (true) {
    yield id++;
  }
}

module.exports = {
  idGenerator
};
