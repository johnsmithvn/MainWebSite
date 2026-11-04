// 📁 src/utils/shuffle.js
// 🔀 Fisher-Yates shuffle (returns a new array, input untouched)

export const shuffleArray = (list = []) => {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export default shuffleArray;
