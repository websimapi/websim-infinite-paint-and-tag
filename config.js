export default {
  CHUNK_SIZE: 512, // Size of each chunk in pixels
  PLAYER_SPEED: 4, // Slightly reduced speed
  PAINT_RADIUS: {
    small: 10,
    medium: 20,
    large: 30,
  },
  PAINT_COOLDOWN: 80, // Allow slightly faster painting
  TAG_COST: 10000, // Increased cost for placing a tag (based on new scoring)
  TAG_SIZE: 100, // Size of the tag image
  SCORE_UPDATE_INTERVAL: 1500, // Update scores slightly less often
  MAX_LOADED_CHUNKS: 9, // Max chunks to keep loaded around the player (3x3 grid) - value not directly used, handled by loadChunksAround logic
  SPECIAL_ABILITY_DURATION: 5000, // Duration of special ability in ms
  SPECIAL_ABILITY_RADIUS_MULTIPLIER: 1.75, // How much bigger brush gets
};