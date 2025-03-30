import { Fragment, jsxDEV } from "react/jsx-dev-runtime";
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { Stage, Layer, Rect, Circle, Image as KonvaImage, Text } from "react-konva";
import Konva from "konva";
import config from "./config.js";
const room = new WebsimSocket();
const {
  CHUNK_SIZE,
  PLAYER_SPEED,
  PAINT_RADIUS,
  PAINT_COOLDOWN,
  TAG_COST,
  TAG_SIZE,
  SCORE_UPDATE_INTERVAL,
  SPECIAL_ABILITY_DURATION,
  SPECIAL_ABILITY_RADIUS_MULTIPLIER
} = config;
const CHUNK_COLLECTION_PREFIX = "chunk_paint_v2_";
const TAG_COLLECTION = "tag_v2";
const getChunkId = (x, y) => {
  const chunkX = Math.floor(x / CHUNK_SIZE);
  const chunkY = Math.floor(y / CHUNK_SIZE);
  return `${chunkX}_${chunkY}`;
};
const getChunkCoords = (chunkId) => {
  const [x, y] = chunkId.split("_").map(Number);
  return { x, y };
};
const getChunkCollectionName = (chunkId) => `${CHUNK_COLLECTION_PREFIX}${chunkId}`;
const Player = React.memo(({ player, isSelf, color, username, avatarImage }) => {
  if (!player || typeof player.x !== "number" || typeof player.y !== "number") {
    return null;
  }
  const radius = 15;
  return /* @__PURE__ */ jsxDEV(Fragment, { children: [
    /* @__PURE__ */ jsxDEV(
      Circle,
      {
        x: player.x,
        y: player.y,
        radius,
        fill: color,
        stroke: player.specialAbilityActive ? "gold" : "black",
        strokeWidth: player.specialAbilityActive ? 3 : 1.5,
        shadowBlur: player.specialAbilityActive ? 8 : 0,
        shadowColor: player.specialAbilityActive ? "gold" : void 0,
        shadowOpacity: 0.9,
        listening: false
      },
      void 0,
      false,
      {
        fileName: "<stdin>",
        lineNumber: 44,
        columnNumber: 7
      }
    ),
    avatarImage && /* @__PURE__ */ jsxDEV(
      KonvaImage,
      {
        image: avatarImage,
        x: player.x - radius * 0.7,
        y: player.y - radius * 0.7,
        width: radius * 1.4,
        height: radius * 1.4,
        cornerRadius: radius * 0.7,
        listening: false
      },
      void 0,
      false,
      {
        fileName: "<stdin>",
        lineNumber: 57,
        columnNumber: 13
      }
    ),
    /* @__PURE__ */ jsxDEV(
      Text,
      {
        text: username || "...",
        x: player.x,
        y: player.y - radius - 14,
        fontSize: 12,
        fill: "#333",
        align: "center",
        width: 100,
        offsetX: 50,
        listening: false
      },
      void 0,
      false,
      {
        fileName: "<stdin>",
        lineNumber: 68,
        columnNumber: 8
      }
    )
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 43,
    columnNumber: 5
  });
});
const PaintSplat = React.memo(({ splat }) => /* @__PURE__ */ jsxDEV(
  Circle,
  {
    x: splat.x,
    y: splat.y,
    radius: splat.radius,
    fill: splat.color,
    opacity: 0.75,
    listening: false
  },
  void 0,
  false,
  {
    fileName: "<stdin>",
    lineNumber: 84,
    columnNumber: 3
  }
));
const Tag = React.memo(({ tag, isAbilitySource }) => {
  const [image, setImage] = useState(null);
  const [status, setStatus] = useState("loading");
  useEffect(() => {
    if (tag?.imageUrl && tag.imageUrl !== image?.src) {
      setStatus("loading");
      const img = new window.Image();
      img.crossOrigin = "Anonymous";
      img.src = tag.imageUrl;
      img.onload = () => {
        setImage(img);
        setStatus("loaded");
      };
      img.onerror = () => {
        console.error("Failed to load tag image:", tag.imageUrl);
        setStatus("error");
      };
    } else if (!tag?.imageUrl) {
      setStatus("error");
    }
  }, [tag?.imageUrl, image?.src]);
  const borderStroke = isAbilitySource ? "gold" : "black";
  const borderStrokeWidth = isAbilitySource ? 4 : 1;
  const shadow = isAbilitySource ? 10 : 0;
  if (!tag || typeof tag.x !== "number" || typeof tag.y !== "number") {
    return null;
  }
  const commonProps = {
    x: tag.x - TAG_SIZE / 2,
    y: tag.y - TAG_SIZE / 2,
    width: TAG_SIZE,
    height: TAG_SIZE,
    stroke: borderStroke,
    strokeWidth: borderStrokeWidth,
    shadowBlur: shadow,
    shadowColor: "gold",
    shadowOpacity: 0.8,
    listening: false
    // Tags generally don't need events
  };
  if (status === "loading" || status === "error" || !image) {
    return /* @__PURE__ */ jsxDEV(Rect, { ...commonProps, fill: "#ddd" }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 142,
      columnNumber: 14
    });
  }
  return /* @__PURE__ */ jsxDEV(
    KonvaImage,
    {
      image,
      ...commonProps
    },
    void 0,
    false,
    {
      fileName: "<stdin>",
      lineNumber: 146,
      columnNumber: 5
    }
  );
});
const Chunk = React.memo(({ chunkId, paintData, tags, activePlayerTags }) => {
  if (!chunkId || typeof chunkId !== "string" || !chunkId.includes("_")) {
    console.warn("Invalid chunkId passed to Chunk component:", chunkId);
    return null;
  }
  const chunkCoords = useMemo(() => getChunkCoords(chunkId), [chunkId]);
  if (!chunkCoords) return null;
  const { x: chunkX, y: chunkY } = chunkCoords;
  const chunkPixelX = chunkX * CHUNK_SIZE;
  const chunkPixelY = chunkY * CHUNK_SIZE;
  const paintSplats = useMemo(() => {
    return Object.values(paintData || {}).filter((splat) => splat && typeof splat.x === "number" && typeof splat.y === "number" && splat.id).map((splat) => /* @__PURE__ */ jsxDEV(PaintSplat, { splat }, splat.id, false, {
      fileName: "<stdin>",
      lineNumber: 175,
      columnNumber: 15
    }));
  }, [paintData]);
  const chunkTags = useMemo(() => {
    return (tags || []).filter((tag) => tag && typeof tag.x === "number" && typeof tag.y === "number" && tag.id).map((tag) => /* @__PURE__ */ jsxDEV(
      Tag,
      {
        tag,
        isAbilitySource: activePlayerTags.has(tag.id)
      },
      tag.id,
      false,
      {
        fileName: "<stdin>",
        lineNumber: 186,
        columnNumber: 15
      }
    ));
  }, [tags, activePlayerTags]);
  return /* @__PURE__ */ jsxDEV(Fragment, { children: [
    paintSplats,
    chunkTags
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 196,
    columnNumber: 5
  });
});
function App() {
  const [players, setPlayers] = useState({});
  const [selfState, setSelfState] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2, color: "#FF0000", brush: "medium", score: 0, specialAbilityActive: false, specialAbilityTimeout: null });
  const [chunks, setChunks] = useState({});
  const [loadedChunkIds, setLoadedChunkIds] = useState(/* @__PURE__ */ new Set());
  const [chunkSubscriptions, setChunkSubscriptions] = useState({});
  const [tagSubscription, setTagSubscription] = useState(null);
  const [presenceSubscription, setPresenceSubscription] = useState(null);
  const [keysPressed, setKeysPressed] = useState({});
  const [lastPaintTime, setLastPaintTime] = useState(0);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [isPlacingTag, setIsPlacingTag] = useState(false);
  const [tagPrompt, setTagPrompt] = useState("");
  const [isGeneratingTag, setIsGeneratingTag] = useState(false);
  const [scores, setScores] = useState({});
  const [playerAvatars, setPlayerAvatars] = useState({});
  const [activePlayerTags, setActivePlayerTags] = useState(/* @__PURE__ */ new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const stageRef = useRef(null);
  const layerRef = useRef(null);
  const selfId = useRef(null);
  const selfUsername = useRef(null);
  useEffect(() => {
    if (!isLoading || error) return;
    let isMounted = true;
    const initialize = async () => {
      try {
        console.log("Initializing Websim connection...");
        await room.initialize();
        if (!isMounted) return;
        selfId.current = room.clientId;
        selfUsername.current = room.peers[selfId.current]?.username || "Player";
        console.log("Initialization complete. Self ID:", selfId.current, "Username:", selfUsername.current);
        if (!room.peers || !room.peers[selfId.current]) {
          throw new Error("Failed to get peer information after initialization.");
        }
        const initialAvatar = await loadAvatar(room.peers[selfId.current]?.avatarUrl);
        if (isMounted) {
          setPlayerAvatars((prev) => ({ ...prev, [selfId.current]: initialAvatar }));
        } else return;
        const initialPresence = {
          x: selfState.x,
          y: selfState.y,
          color: selfState.color,
          brush: selfState.brush,
          score: selfState.score,
          specialAbilityActive: selfState.specialAbilityActive
        };
        room.updatePresence(initialPresence);
        console.log("Initial presence sent:", initialPresence);
        const unsubPresence = room.subscribePresence(handlePresenceUpdate);
        if (isMounted) setPresenceSubscription(() => unsubPresence);
        else unsubPresence();
        const unsubTags = room.collection(TAG_COLLECTION).subscribe(handleTagUpdate);
        if (isMounted) setTagSubscription(() => unsubTags);
        else unsubTags();
        if (selfId.current) {
          loadChunksAround(selfState.x, selfState.y);
          centerStageOnPlayer(selfState.x, selfState.y);
        } else {
          throw new Error("Self ID not set after initialization, cannot load chunks.");
        }
        if (isMounted) setIsLoading(false);
      } catch (err) {
        console.error("Initialization failed:", err);
        if (isMounted) setError(err.message || "Failed to initialize. Please refresh.");
      }
    };
    initialize();
    return () => {
      isMounted = false;
      console.log("Cleaning up subscriptions...");
      presenceSubscription?.();
      tagSubscription?.();
      Object.values(chunkSubscriptions).forEach((unsub) => unsub?.());
      if (selfState.specialAbilityTimeout) {
        clearTimeout(selfState.specialAbilityTimeout);
      }
    };
  }, []);
  const loadAvatar = useCallback(async (url) => {
    if (!url) return null;
    return new Promise((resolve) => {
      const img = new window.Image();
      img.crossOrigin = "Anonymous";
      img.src = url;
      img.onload = () => resolve(img);
      img.onerror = () => {
        console.warn("Failed to load avatar:", url);
        resolve(null);
      };
    });
  }, []);
  const handlePresenceUpdate = useCallback(async (presence) => {
    if (!room.peers) {
      console.warn("Received presence update before room.peers was initialized.");
      return;
    }
    const updatedPlayers = {};
    const avatarLoadPromises = [];
    const currentAvatars = { ...playerAvatars };
    for (const [clientId, playerData] of Object.entries(presence)) {
      const peerInfo = room.peers[clientId];
      if (playerData && peerInfo) {
        const username = peerInfo.username;
        if (typeof playerData.x === "number" && typeof playerData.y === "number") {
          updatedPlayers[clientId] = { ...playerData, username };
        } else {
          const existingPlayer = players[clientId];
          if (existingPlayer && typeof existingPlayer.x === "number" && typeof existingPlayer.y === "number") {
            updatedPlayers[clientId] = { ...existingPlayer, ...playerData, username };
          } else {
            console.warn(`Player ${clientId} (${username}) received invalid coordinates:`, playerData);
            continue;
          }
        }
        const avatarUrl = peerInfo.avatarUrl;
        if (avatarUrl && (!currentAvatars[clientId] || currentAvatars[clientId]?.src !== avatarUrl)) {
          avatarLoadPromises.push(
            loadAvatar(avatarUrl).then((img) => {
              setPlayerAvatars((prev) => ({ ...prev, [clientId]: img }));
            })
          );
        } else if (!avatarUrl && currentAvatars[clientId]) {
          setPlayerAvatars((prev) => {
            const newState = { ...prev };
            delete newState[clientId];
            return newState;
          });
        }
      } else {
        setPlayerAvatars((prev) => {
          const newState = { ...prev };
          delete newState[clientId];
          return newState;
        });
      }
    }
    await Promise.all(avatarLoadPromises);
    setPlayers(updatedPlayers);
  }, [playerAvatars, loadAvatar, players]);
  const handleTagUpdate = useCallback((allTags) => {
    setChunks((prevChunks) => {
      const newChunks = { ...prevChunks };
      const activeChunkIds = new Set(Object.keys(newChunks));
      const tagMapByChunk = {};
      allTags.forEach((tag) => {
        if (!tag || typeof tag.x !== "number" || typeof tag.y !== "number" || !tag.id) {
          console.warn("Received invalid tag data:", tag);
          return;
        }
        const chunkId = getChunkId(tag.x, tag.y);
        if (!tagMapByChunk[chunkId]) {
          tagMapByChunk[chunkId] = [];
        }
        tagMapByChunk[chunkId].push(tag);
        activeChunkIds.add(chunkId);
      });
      activeChunkIds.forEach((chunkId) => {
        const existingChunk = newChunks[chunkId] || { paint: {}, tags: [] };
        const newTagsForChunk = tagMapByChunk[chunkId] || [];
        if (JSON.stringify(existingChunk.tags) !== JSON.stringify(newTagsForChunk)) {
          newChunks[chunkId] = {
            ...existingChunk,
            tags: newTagsForChunk
          };
        } else if (!newChunks[chunkId] && newTagsForChunk.length > 0) {
          newChunks[chunkId] = { paint: {}, tags: newTagsForChunk };
          console.log(`Created placeholder chunk ${chunkId} for tag update.`);
        }
      });
      return newChunks;
    });
  }, []);
  const handleChunkPaintUpdate = useCallback((chunkId, paintSplats) => {
    setChunks((prev) => {
      const currentChunkData = prev[chunkId] || { tags: [] };
      const newPaintMap = (paintSplats || []).reduce((acc, splat) => {
        if (splat && splat.id && typeof splat.x === "number" && typeof splat.y === "number") {
          acc[splat.id] = splat;
        } else {
          console.warn(`Invalid splat data received for chunk ${chunkId}:`, splat);
        }
        return acc;
      }, {});
      if (JSON.stringify(currentChunkData.paint) !== JSON.stringify(newPaintMap)) {
        return {
          ...prev,
          [chunkId]: {
            ...currentChunkData,
            // Keep existing tags
            paint: newPaintMap
          }
        };
      } else {
        return prev;
      }
    });
  }, []);
  const centerStageOnPlayer = useCallback((playerX, playerY) => {
    if (stageRef.current) {
      const container2 = stageRef.current.container();
      if (container2 && container2.offsetWidth > 0 && container2.offsetHeight > 0) {
        setStagePos({
          x: -playerX + container2.offsetWidth / 2,
          y: -playerY + container2.offsetHeight / 2
        });
      }
    }
  }, []);
  useEffect(() => {
    if (isLoading || error || !selfId.current) return;
    const moveInterval = setInterval(() => {
      let dx = 0;
      let dy = 0;
      if (keysPressed["w"] || keysPressed["ArrowUp"]) dy -= PLAYER_SPEED;
      if (keysPressed["s"] || keysPressed["ArrowDown"]) dy += PLAYER_SPEED;
      if (keysPressed["a"] || keysPressed["ArrowLeft"]) dx -= PLAYER_SPEED;
      if (keysPressed["d"] || keysPressed["ArrowRight"]) dx += PLAYER_SPEED;
      if (dx !== 0 || dy !== 0) {
        setSelfState((prev) => {
          if (typeof prev.x !== "number" || typeof prev.y !== "number") {
            console.error("Invalid selfState coordinates before movement:", prev);
            return { ...prev, x: window.innerWidth / 2, y: window.innerHeight / 2 };
          }
          const newX = prev.x + dx;
          const newY = prev.y + dy;
          const currentActiveTags = /* @__PURE__ */ new Set();
          let isOnOwnTag = false;
          Object.values(chunks).forEach((chunk) => {
            (chunk?.tags || []).forEach((tag) => {
              if (tag && tag.username === selfUsername.current && typeof tag.x === "number" && typeof tag.y === "number") {
                if (Math.hypot(newX - tag.x, newY - tag.y) < TAG_SIZE / 2) {
                  isOnOwnTag = true;
                  currentActiveTags.add(tag.id);
                }
              }
            });
          });
          setActivePlayerTags((prevActiveTags) => {
            if (prevActiveTags.size !== currentActiveTags.size || ![...prevActiveTags].every((id) => currentActiveTags.has(id))) {
              return currentActiveTags;
            }
            return prevActiveTags;
          });
          let specialAbilityActive = prev.specialAbilityActive;
          let specialAbilityTimeout = prev.specialAbilityTimeout;
          let presenceUpdateNeeded = false;
          if (isOnOwnTag && !prev.specialAbilityActive) {
            specialAbilityActive = true;
            presenceUpdateNeeded = true;
            if (prev.specialAbilityTimeout) clearTimeout(prev.specialAbilityTimeout);
            specialAbilityTimeout = setTimeout(() => {
              let stillOnTag = false;
              const currentX = selfState.x;
              const currentY = selfState.y;
              Object.values(chunks).forEach((chunk) => {
                (chunk?.tags || []).forEach((tag) => {
                  if (tag && tag.username === selfUsername.current && typeof tag.x === "number" && typeof tag.y === "number") {
                    if (Math.hypot(currentX - tag.x, currentY - tag.y) < TAG_SIZE / 2) {
                      stillOnTag = true;
                    }
                  }
                });
              });
              if (!stillOnTag) {
                setSelfState((s) => ({ ...s, specialAbilityActive: false, specialAbilityTimeout: null }));
                if (selfId.current) room.updatePresence({ specialAbilityActive: false });
              } else {
                setSelfState((s) => ({ ...s, specialAbilityTimeout: null }));
              }
            }, SPECIAL_ABILITY_DURATION);
          } else if (!isOnOwnTag && prev.specialAbilityActive) {
            specialAbilityActive = false;
            presenceUpdateNeeded = true;
            if (prev.specialAbilityTimeout) {
              clearTimeout(prev.specialAbilityTimeout);
              specialAbilityTimeout = null;
            }
          }
          const presenceUpdate = { x: newX, y: newY };
          let shouldUpdatePresence = dx !== 0 || dy !== 0;
          if (specialAbilityActive !== prev.specialAbilityActive) {
            presenceUpdate.specialAbilityActive = specialAbilityActive;
            shouldUpdatePresence = true;
          }
          if (shouldUpdatePresence && selfId.current) {
            room.updatePresence(presenceUpdate);
          }
          loadChunksAround(newX, newY);
          centerStageOnPlayer(newX, newY);
          return { ...prev, x: newX, y: newY, specialAbilityActive, specialAbilityTimeout };
        });
      }
    }, 16);
    return () => clearInterval(moveInterval);
  }, [keysPressed, chunks, selfState.specialAbilityActive, selfState.specialAbilityTimeout, selfUsername.current, loadChunksAround, centerStageOnPlayer, isLoading, error, selfState.x, selfState.y]);
  useEffect(() => {
    if (isLoading || error) return;
    const handleKeyDown = (e) => {
      if (document.activeElement?.closest(".tag-input")) return;
      if (e.key === "t" && !isPlacingTag && !isGeneratingTag && selfState.score >= TAG_COST) {
        setIsPlacingTag(true);
      } else if (e.key === "Escape") {
        if (isPlacingTag) {
          setIsPlacingTag(false);
          setTagPrompt("");
        }
      } else if (!isPlacingTag && !isGeneratingTag) {
        const keyLower = e.key.toLowerCase();
        if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(keyLower)) {
          setKeysPressed((prev) => ({ ...prev, [keyLower]: true }));
        }
        if (keyLower === " ") {
          handlePaint();
          setKeysPressed((prev) => ({ ...prev, " ": true }));
        }
      }
    };
    const handleKeyUp = (e) => {
      const keyLower = e.key.toLowerCase();
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(keyLower)) {
        setKeysPressed((prev) => ({ ...prev, [keyLower]: false }));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isPlacingTag, isGeneratingTag, selfState.score, handlePaint, isLoading, error]);
  useEffect(() => {
    if (isLoading || error) return;
    const stage = stageRef.current;
    if (!stage) return;
    let isPainting = false;
    const handleStageMouseDown = (e) => {
      if (e.target === stage && !isPlacingTag && !isGeneratingTag) {
        isPainting = true;
        handlePaint();
      }
    };
    const handleStageMouseMove = (e) => {
      if (isPainting && !isPlacingTag && !isGeneratingTag) {
        handlePaint();
      }
    };
    const handleStageMouseUpOrLeave = () => {
      isPainting = false;
    };
    stage.on("mousedown touchstart", handleStageMouseDown);
    stage.on("mousemove touchmove", handleStageMouseMove);
    stage.on("mouseup touchend", handleStageMouseUpOrLeave);
    stage.on("mouseleave", handleStageMouseUpOrLeave);
    return () => {
      stage.off("mousedown touchstart", handleStageMouseDown);
      stage.off("mousemove touchmove", handleStageMouseMove);
      stage.off("mouseup touchend", handleStageMouseUpOrLeave);
      stage.off("mouseleave", handleStageMouseUpOrLeave);
    };
  }, [handlePaint, isPlacingTag, isGeneratingTag, isLoading, error]);
  const loadChunksAround = useCallback((worldX, worldY) => {
    if (!selfId.current || typeof worldX !== "number" || typeof worldY !== "number") return;
    const currentChunkId = getChunkId(worldX, worldY);
    const { x: currentChunkX, y: currentChunkY } = getChunkCoords(currentChunkId);
    const neededChunks = /* @__PURE__ */ new Set();
    const currentLoaded = new Set(loadedChunkIds);
    const subs = { ...chunkSubscriptions };
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const chunkId = `${currentChunkX + dx}_${currentChunkY + dy}`;
        neededChunks.add(chunkId);
      }
    }
    let updatedSubs = false;
    let updatedLoadedIds = false;
    neededChunks.forEach((chunkId) => {
      if (!currentLoaded.has(chunkId)) {
        const collectionName = getChunkCollectionName(chunkId);
        const chunkUpdateHandler = (paintSplats) => handleChunkPaintUpdate(chunkId, paintSplats);
        const unsubscribe = room.collection(collectionName).subscribe(chunkUpdateHandler);
        subs[chunkId] = unsubscribe;
        updatedSubs = true;
        const chunkTags = room.collection(TAG_COLLECTION).filter({ chunkId }).getList();
        setChunks((prev) => ({
          ...prev,
          [chunkId]: {
            paint: prev[chunkId]?.paint || {},
            tags: chunkTags || []
          }
        }));
        setLoadedChunkIds((prev) => {
          updatedLoadedIds = true;
          return new Set(prev).add(chunkId);
        });
      }
    });
    currentLoaded.forEach((chunkId) => {
      if (!neededChunks.has(chunkId)) {
        subs[chunkId]?.();
        delete subs[chunkId];
        updatedSubs = true;
        setLoadedChunkIds((prev) => {
          const newSet = new Set(prev);
          if (newSet.delete(chunkId)) {
            updatedLoadedIds = true;
          }
          return newSet;
        });
        setChunks((prev) => {
          if (prev[chunkId]) {
            const newChunks = { ...prev };
            delete newChunks[chunkId];
            return newChunks;
          }
          return prev;
        });
      }
    });
    if (updatedSubs) {
      setChunkSubscriptions(subs);
    }
  }, [loadedChunkIds, chunkSubscriptions, handleChunkPaintUpdate]);
  const handlePaint = useCallback(() => {
    if (isLoading || error || !selfId.current || isPlacingTag || isGeneratingTag) return;
    const now = Date.now();
    if (now - lastPaintTime < PAINT_COOLDOWN) return;
    const { x, y, color, brush, specialAbilityActive } = selfState;
    if (typeof x !== "number" || typeof y !== "number" || !color || !brush) {
      console.warn("Attempted to paint with invalid selfState:", selfState);
      return;
    }
    const chunkId = getChunkId(x, y);
    const collectionName = getChunkCollectionName(chunkId);
    let radius = PAINT_RADIUS[brush];
    if (specialAbilityActive) {
      radius *= SPECIAL_ABILITY_RADIUS_MULTIPLIER;
    }
    const splatData = {
      x,
      y,
      color,
      radius,
      username: selfUsername.current,
      timestamp: now
    };
    room.collection(collectionName).create(splatData).catch((err) => {
      console.error("Error creating paint splat:", err);
    });
    setLastPaintTime(now);
  }, [lastPaintTime, selfState, selfId.current, selfUsername.current, isPlacingTag, isGeneratingTag, isLoading, error]);
  const handlePlaceTag = useCallback(async () => {
    if (isLoading || error || !tagPrompt || isGeneratingTag || selfState.score < TAG_COST || !selfId.current) return;
    setIsGeneratingTag(true);
    setIsPlacingTag(false);
    let newScore = selfState.score;
    try {
      console.log("Generating tag image for prompt:", tagPrompt);
      newScore = selfState.score - TAG_COST;
      setSelfState((prev) => ({ ...prev, score: newScore }));
      room.updatePresence({ score: newScore });
      const imageResult = await websim.imageGen({
        prompt: `Pixel art sprite style: ${tagPrompt}`,
        aspect_ratio: "1:1",
        width: TAG_SIZE * 2,
        height: TAG_SIZE * 2
      });
      if (!imageResult || !imageResult.url) {
        throw new Error("Image generation failed or returned no URL.");
      }
      console.log("Tag image generated:", imageResult.url);
      const { x, y } = selfState;
      if (typeof x !== "number" || typeof y !== "number" || !selfUsername.current) {
        throw new Error("Invalid player state for tag creation.");
      }
      const chunkId = getChunkId(x, y);
      await room.collection(TAG_COLLECTION).create({
        x,
        y,
        chunkId,
        prompt: tagPrompt,
        imageUrl: imageResult.url,
        username: selfUsername.current,
        timestamp: Date.now()
      });
      console.log("Tag placed successfully at", x, y);
      setTagPrompt("");
    } catch (err) {
      console.error("Error placing tag:", err);
      setSelfState((prev) => ({ ...prev, score: prev.score + TAG_COST }));
      room.updatePresence({ score: selfState.score });
      alert(`Error creating tag: ${err.message}`);
    } finally {
      setIsGeneratingTag(false);
    }
  }, [tagPrompt, isGeneratingTag, selfState, selfId.current, selfUsername.current, isLoading, error]);
  useEffect(() => {
    if (isLoading || error || !selfId.current) return;
    const calculateScores = () => {
      const newScores = {};
      const activeUsernames = new Set(Object.values(players).map((p) => p.username).filter(Boolean));
      if (selfUsername.current) {
        activeUsernames.add(selfUsername.current);
      }
      if (activeUsernames.size === 0) {
        setScores({});
        return;
      }
      activeUsernames.forEach((username) => newScores[username] = 0);
      const scoringCanvases = {};
      const getScoringContext = (chunkId) => {
        if (!scoringCanvases[chunkId]) {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = CHUNK_SIZE;
            canvas.height = CHUNK_SIZE;
            const ctx = canvas.getContext("2d", { willReadFrequently: true });
            if (!ctx) throw new Error("Context creation failed");
            scoringCanvases[chunkId] = { canvas, ctx };
          } catch (err) {
            console.error(`Failed to create scoring canvas for chunk ${chunkId}:`, err);
            return null;
          }
        }
        scoringCanvases[chunkId].ctx.clearRect(0, 0, CHUNK_SIZE, CHUNK_SIZE);
        return scoringCanvases[chunkId].ctx;
      };
      Object.entries(chunks).forEach(([chunkId, chunkData]) => {
        if (chunkData?.paint && Object.keys(chunkData.paint).length > 0) {
          const ctx = getScoringContext(chunkId);
          if (!ctx) return;
          const sortedSplats = Object.values(chunkData.paint).filter((splat) => splat && typeof splat.x === "number" && typeof splat.y === "number" && splat.timestamp).sort((a, b) => a.timestamp - b.timestamp);
          const chunkCoords = getChunkCoords(chunkId);
          if (!chunkCoords) return;
          const { x: chunkOriginX, y: chunkOriginY } = chunkCoords;
          sortedSplats.forEach((splat) => {
            ctx.fillStyle = splat.color || "#000000";
            ctx.beginPath();
            const relativeX = splat.x - chunkOriginX * CHUNK_SIZE;
            const relativeY = splat.y - chunkOriginY * CHUNK_SIZE;
            const radius = Math.max(1, splat.radius || 10);
            ctx.arc(relativeX, relativeY, radius, 0, Math.PI * 2);
            ctx.fill();
          });
        }
      });
      const SAMPLE_STEP = 8;
      Object.entries(scoringCanvases).forEach(([chunkId, { ctx }]) => {
        if (!ctx) return;
        try {
          const imageData = ctx.getImageData(0, 0, CHUNK_SIZE, CHUNK_SIZE);
          const data = imageData.data;
          const pixelScores = {};
          for (let y = 0; y < CHUNK_SIZE; y += SAMPLE_STEP) {
            for (let x = 0; x < CHUNK_SIZE; x += SAMPLE_STEP) {
              const index = (y * CHUNK_SIZE + x) * 4;
              const r = data[index];
              const g = data[index + 1];
              const b = data[index + 2];
              const a = data[index + 3];
              if (a > 128) {
                const hexColor = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`.toUpperCase();
                pixelScores[hexColor] = (pixelScores[hexColor] || 0) + SAMPLE_STEP * SAMPLE_STEP;
              }
            }
          }
          const colorToUser = {};
          Object.values(players).forEach((p) => {
            if (p?.color && p.username) colorToUser[p.color.toUpperCase()] = p.username;
          });
          if (selfState.color && selfUsername.current) colorToUser[selfState.color.toUpperCase()] = selfUsername.current;
          Object.values(chunks[chunkId]?.paint || {}).forEach((splat) => {
            if (splat?.color && splat.username && !colorToUser[splat.color.toUpperCase()]) {
              colorToUser[splat.color.toUpperCase()] = splat.username;
            }
          });
          Object.entries(pixelScores).forEach(([hexColor, area]) => {
            const username = colorToUser[hexColor];
            if (username) {
              if (newScores[username] === void 0) newScores[username] = 0;
              newScores[username] += area;
            }
          });
        } catch (imgDataError) {
          console.error(`Error getting/processing ImageData for chunk ${chunkId}:`, imgDataError);
        }
      });
      const finalScores = {};
      activeUsernames.forEach((username) => {
        finalScores[username] = Math.floor(newScores[username] || 0);
      });
      if (JSON.stringify(scores) !== JSON.stringify(finalScores)) {
        setScores(finalScores);
      }
      const newSelfScore = finalScores[selfUsername.current] || 0;
      if (newSelfScore !== selfState.score) {
        setSelfState((prev) => ({ ...prev, score: newSelfScore }));
        if (Math.abs(newSelfScore - (players[selfId.current]?.score || 0)) > 50) {
          room.updatePresence({ score: newSelfScore });
        }
      }
    };
    const scoreInterval = setInterval(calculateScores, SCORE_UPDATE_INTERVAL);
    return () => clearInterval(scoreInterval);
  }, [chunks, players, selfState.color, selfState.score, selfId.current, selfUsername.current, isLoading, error, scores]);
  const sortedScores = useMemo(() => {
    const peerData = room.peers || {};
    return Object.entries(scores).map(([username, score]) => {
      let clientId = null;
      if (username === selfUsername.current) {
        clientId = selfId.current;
      } else {
        const playerEntry = Object.entries(players).find(([id, p]) => p.username === username);
        if (playerEntry) clientId = playerEntry[0];
      }
      const avatarUrl = clientId ? peerData[clientId]?.avatarUrl : null;
      return { username, score, avatarUrl };
    }).filter((s) => s.score > 0 || s.username === selfUsername.current).sort((a, b) => b.score - a.score);
  }, [scores, players, selfId.current, selfUsername.current, room.peers]);
  const selfPlayerData = useMemo(() => {
    const baseData = players[selfId.current] || {};
    return {
      ...baseData,
      // Synced data first
      ...selfState,
      // Override with local state (more up-to-date pos, color, etc.)
      username: selfUsername.current || "You"
      // Ensure username is set
      // avatarImage handled separately via playerAvatars state
    };
  }, [players, selfState, selfId.current, selfUsername.current]);
  if (isLoading) {
    return /* @__PURE__ */ jsxDEV("div", { style: { padding: "20px", fontSize: "1.2em" }, children: "Loading Infinite Painter..." }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 1112,
      columnNumber: 14
    }, this);
  }
  if (error) {
    return /* @__PURE__ */ jsxDEV("div", { style: { padding: "20px", color: "red", fontSize: "1.2em" }, children: [
      "Error: ",
      error
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 1115,
      columnNumber: 15
    }, this);
  }
  if (!selfId.current) {
    return /* @__PURE__ */ jsxDEV("div", { style: { padding: "20px", color: "orange", fontSize: "1.2em" }, children: "Waiting for connection..." }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 1119,
      columnNumber: 15
    }, this);
  }
  return /* @__PURE__ */ jsxDEV("div", { children: [
    /* @__PURE__ */ jsxDEV("div", { className: "controls", children: [
      /* @__PURE__ */ jsxDEV("label", { htmlFor: "color", children: "Color:" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 1127,
        columnNumber: 12
      }, this),
      /* @__PURE__ */ jsxDEV(
        "input",
        {
          type: "color",
          id: "color",
          value: selfState.color,
          onChange: (e) => {
            const newColor = e.target.value;
            setSelfState((prev) => ({ ...prev, color: newColor }));
            room.updatePresence({ color: newColor });
          }
        },
        void 0,
        false,
        {
          fileName: "<stdin>",
          lineNumber: 1128,
          columnNumber: 12
        },
        this
      ),
      /* @__PURE__ */ jsxDEV("label", { htmlFor: "brush", children: "Brush:" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 1138,
        columnNumber: 12
      }, this),
      /* @__PURE__ */ jsxDEV(
        "select",
        {
          id: "brush",
          value: selfState.brush,
          onChange: (e) => {
            const newBrush = e.target.value;
            setSelfState((prev) => ({ ...prev, brush: newBrush }));
            room.updatePresence({ brush: newBrush });
          },
          children: [
            /* @__PURE__ */ jsxDEV("option", { value: "small", children: "Small" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 1148,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("option", { value: "medium", children: "Medium" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 1149,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("option", { value: "large", children: "Large" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 1150,
              columnNumber: 17
            }, this)
          ]
        },
        void 0,
        true,
        {
          fileName: "<stdin>",
          lineNumber: 1139,
          columnNumber: 12
        },
        this
      ),
      /* @__PURE__ */ jsxDEV("span", { children: [
        "Score: ",
        selfState.score
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 1152,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV("button", { onClick: () => setIsPlacingTag(true), disabled: selfState.score < TAG_COST || isPlacingTag || isGeneratingTag, title: `Cost: ${TAG_COST} Score`, children: [
        "Place Tag ",
        isGeneratingTag ? "(..." : `(-${TAG_COST})`
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 1153,
        columnNumber: 13
      }, this),
      selfState.specialAbilityActive && /* @__PURE__ */ jsxDEV("span", { style: { color: "gold", fontWeight: "bold", marginLeft: "5px", textShadow: "0 0 3px black" }, children: "\u26A1 ACTIVE!" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 1156,
        columnNumber: 48
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 1126,
      columnNumber: 8
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "score-board", children: [
      /* @__PURE__ */ jsxDEV("h3", { children: "Scores" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 1161,
        columnNumber: 14
      }, this),
      sortedScores.map(({ username, score, avatarUrl }) => /* @__PURE__ */ jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDEV(
          "img",
          {
            src: avatarUrl || `https://images.websim.ai/avatar/${username}?size=40&fallback=true`,
            alt: username,
            onError: (e) => {
              e.target.src = "https://images.websim.ai/default-avatar.png";
            }
          },
          void 0,
          false,
          {
            fileName: "<stdin>",
            lineNumber: 1164,
            columnNumber: 22
          },
          this
        ),
        /* @__PURE__ */ jsxDEV("span", { children: username }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1168,
          columnNumber: 22
        }, this),
        /* @__PURE__ */ jsxDEV("span", { children: score }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 1169,
          columnNumber: 22
        }, this)
      ] }, username, true, {
        fileName: "<stdin>",
        lineNumber: 1163,
        columnNumber: 18
      }, this))
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 1160,
      columnNumber: 9
    }, this),
    isPlacingTag && /* @__PURE__ */ jsxDEV("div", { className: "tag-input", children: [
      /* @__PURE__ */ jsxDEV(
        "input",
        {
          type: "text",
          placeholder: "Enter tag prompt (e.g., 'a happy cat wizard')",
          value: tagPrompt,
          onChange: (e) => setTagPrompt(e.target.value),
          onKeyDown: (e) => {
            if (e.key === "Enter" && tagPrompt && !isGeneratingTag) handlePlaceTag();
          },
          autoFocus: true
        },
        void 0,
        false,
        {
          fileName: "<stdin>",
          lineNumber: 1177,
          columnNumber: 15
        },
        this
      ),
      /* @__PURE__ */ jsxDEV("button", { onClick: handlePlaceTag, disabled: !tagPrompt || isGeneratingTag, children: isGeneratingTag ? "Generating..." : "Create Tag" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 1185,
        columnNumber: 15
      }, this),
      /* @__PURE__ */ jsxDEV("button", { onClick: () => {
        setIsPlacingTag(false);
        setTagPrompt("");
      }, className: "cancel-button", children: "Cancel" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 1188,
        columnNumber: 15
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 1176,
      columnNumber: 11
    }, this),
    /* @__PURE__ */ jsxDEV(
      Stage,
      {
        width: window.innerWidth,
        height: window.innerHeight,
        x: stagePos.x,
        y: stagePos.y,
        ref: stageRef,
        onContextMenu: (e) => e.evt.preventDefault(),
        children: /* @__PURE__ */ jsxDEV(Layer, { ref: layerRef, imageSmoothingEnabled: false, perfectDrawEnabled: false, children: [
          Array.from(loadedChunkIds).map((chunkId) => {
            const chunkData = chunks[chunkId];
            if (!chunkData) return null;
            return /* @__PURE__ */ jsxDEV(
              Chunk,
              {
                chunkId,
                paintData: chunkData.paint || {},
                tags: chunkData.tags || [],
                activePlayerTags
              },
              chunkId,
              false,
              {
                fileName: "<stdin>",
                lineNumber: 1209,
                columnNumber: 19
              },
              this
            );
          }),
          Object.entries(players).map(([id, player]) => {
            if (id === selfId.current) return null;
            return /* @__PURE__ */ jsxDEV(
              Player,
              {
                player,
                isSelf: false,
                color: player.color || "#888888",
                username: player.username,
                avatarImage: playerAvatars[id]
              },
              id,
              false,
              {
                fileName: "<stdin>",
                lineNumber: 1223,
                columnNumber: 23
              },
              this
            );
          }),
          /* @__PURE__ */ jsxDEV(
            Player,
            {
              player: selfPlayerData,
              isSelf: true,
              color: selfPlayerData.color,
              username: selfPlayerData.username,
              avatarImage: playerAvatars[selfId.current]
            },
            selfId.current,
            false,
            {
              fileName: "<stdin>",
              lineNumber: 1234,
              columnNumber: 12
            },
            this
          )
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 1202,
          columnNumber: 9
        }, this)
      },
      void 0,
      false,
      {
        fileName: "<stdin>",
        lineNumber: 1193,
        columnNumber: 7
      },
      this
    )
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 1124,
    columnNumber: 5
  }, this);
}
const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(/* @__PURE__ */ jsxDEV(App, {}, void 0, false, {
    fileName: "<stdin>",
    lineNumber: 1253,
    columnNumber: 17
  }));
} else {
  console.error("Root element not found!");
  document.body.innerHTML = '<div style="color: red; padding: 20px;">Error: Could not find root element to mount the application.</div>';
}
