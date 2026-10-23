/**
 * ==========================================================================
 * 치이카와 잡기! (Chiikawa Catch Game) - 핵심 스크립트
 * 캐릭터별 차등 점수 시스템:
 *   - 치이카와: 10점 (등장 확률 60%, 체류 시간 가장 김)
 *   - 하치와레: 20점 (등장 확률 30%, 보통 속도로 사라짐)
 *   - 우사기: 50점 (등장 확률 10%, 번개처럼 짧게 머물러 잡기 어려움)
 * 난이도별 설정:
 *   - 쉬움: 45초 / 보통: 30초 / 어려움: 30초 (난이도별 최고점수 개별 저장)
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM 참조 ---
  const gameNotice = document.getElementById('gameNotice');
  const currentScoreEl = document.getElementById('currentScore');
  const timeLeftEl = document.getElementById('timeLeft');
  const highScoreEl = document.getElementById('highScore');
  const highScoreDiffLabel = document.getElementById('highScoreDiffLabel');
  const timerCard = document.getElementById('timerCard');
  const timerProgressBar = document.getElementById('timerProgressBar');
  const startBtn = document.getElementById('startBtn');
  const resetScoreBtn = document.getElementById('resetScoreBtn');
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const soundIcon = document.getElementById('soundIcon');
  const diffBtns = document.querySelectorAll('.diff-btn');

  const holes = document.querySelectorAll('.hole');

  // 모달창 요소
  const resultModal = document.getElementById('resultModal');
  const modalBadge = document.getElementById('modalBadge');
  const modalTitle = document.getElementById('modalTitle');
  const modalDifficultyBadge = document.getElementById('modalDifficultyBadge');
  const modalSubtitle = document.getElementById('modalSubtitle');
  const modalFinalScore = document.getElementById('modalFinalScore');
  const modalMolesWhacked = document.getElementById('modalMolesWhacked');
  const bdChiikawaCount = document.getElementById('bdChiikawaCount');
  const bdHachiwareCount = document.getElementById('bdHachiwareCount');
  const bdUsagiCount = document.getElementById('bdUsagiCount');
  const modalComment = document.getElementById('modalComment');
  const commentEmoji = document.getElementById('commentEmoji');
  const newRecordBanner = document.getElementById('newRecordBanner');
  const restartBtn = document.getElementById('restartBtn');
  const closeModalBtn = document.getElementById('closeModalBtn');

  // --- 난이도 설정 (쉬움 45초, 보통 30초, 어려움 30초) ---
  const DIFFICULTY_CONFIG = {
    easy: {
      name: '쉬움',
      badgeText: '🌱 쉬움 (45초)',
      duration: 45,
      baseStay: 1100,
      minStay: 750,
      baseDelay: 480,
      minDelay: 320,
      multiSpawnChance: 0,
      storageKey: 'chiikawa_catch_best_easy_v2'
    },
    normal: {
      name: '보통',
      badgeText: '⭐ 보통 (30초)',
      duration: 30,
      baseStay: 900,
      minStay: 520,
      baseDelay: 380,
      minDelay: 220,
      multiSpawnChance: 0.08,
      storageKey: 'chiikawa_catch_best_normal_v2'
    },
    hard: {
      name: '어려움',
      badgeText: '🔥 어려움 (30초)',
      duration: 30,
      baseStay: 650,
      minStay: 380,
      baseDelay: 260,
      minDelay: 150,
      multiSpawnChance: 0.25,
      storageKey: 'chiikawa_catch_best_hard_v2'
    }
  };

  let currentDifficulty = 'normal';
  let gameDuration = DIFFICULTY_CONFIG.normal.duration;

  // --- 게임 상태 변수 ---
  let isGameActive = false;
  let score = 0;
  let molesWhackedCount = 0;
  let charWhackedCounts = { chiikawa: 0, hachiware: 0, usagi: 0 };
  let timeLeft = gameDuration;
  let isSoundEnabled = true;

  let timerInterval = null;
  let moleTimerTimeout = null;
  let lastHoleIndex = -1;

  // --- 캐릭터별 차등 점수, 등장 확률, 체류 시간 배율 정의 (요구사항 1, 2번) ---
  const CHARACTERS = [
    {
      id: 'chiikawa',
      name: '치이카와',
      score: 10,                 // 10점
      probability: 0.60,         // 60% 확률
      stayMultiplier: 1.0,       // 오래 머묾 (100%)
      className: 'char-chiikawa',
      hitSoundFreq: 580,
      hitClass: 'score-10',
      svg: `
        <svg class="char-svg" viewBox="0 0 120 130" xmlns="http://www.w3.org/2000/svg">
          <circle cx="30" cy="42" r="14" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
          <circle cx="30" cy="42" r="8" fill="#FFD1DC"/>
          <circle cx="90" cy="42" r="14" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
          <circle cx="90" cy="42" r="8" fill="#FFD1DC"/>
          <ellipse cx="60" cy="80" rx="46" ry="44" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2.5"/>
          <ellipse cx="32" cy="76" rx="8" ry="5.5" fill="#FFAEBC" opacity="0.8"/>
          <ellipse cx="88" cy="76" rx="8" ry="5.5" fill="#FFAEBC" opacity="0.8"/>
          <g class="face-normal">
            <path d="M37 57 Q43 59 47 56" stroke="#475569" stroke-width="2.2" stroke-linecap="round" fill="none"/>
            <path d="M83 57 Q77 59 73 56" stroke="#475569" stroke-width="2.2" stroke-linecap="round" fill="none"/>
            <circle cx="43" cy="67" r="6" fill="#1E293B"/>
            <circle cx="41.5" cy="64.8" r="2.2" fill="#FFFFFF"/>
            <circle cx="44.8" cy="69" r="1.1" fill="#FFFFFF"/>
            <circle cx="77" cy="67" r="6" fill="#1E293B"/>
            <circle cx="75.5" cy="64.8" r="2.2" fill="#FFFFFF"/>
            <circle cx="78.8" cy="69" r="1.1" fill="#FFFFFF"/>
            <ellipse cx="60" cy="72" rx="1.6" ry="1.2" fill="#334155"/>
            <path d="M54 77 Q57 80 60 77 Q63 80 66 77" stroke="#475569" stroke-width="2.2" stroke-linecap="round" fill="none"/>
          </g>
          <g class="face-hit">
            <path d="M38 63 L46 68 L38 73" stroke="#334155" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            <path d="M82 63 L74 68 L82 73" stroke="#334155" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            <ellipse cx="60" cy="80" rx="7" ry="5.5" fill="#FF8A80" stroke="#E11D48" stroke-width="1.5"/>
            <path d="M30 68 Q25 72 28 77 Q32 77 32 72 Z" fill="#60A5FA"/>
            <path d="M90 68 Q95 72 92 77 Q88 77 88 72 Z" fill="#60A5FA"/>
          </g>
          <ellipse cx="36" cy="115" rx="9" ry="7" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.8"/>
          <ellipse cx="84" cy="115" rx="9" ry="7" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.8"/>
        </svg>
      `
    },
    {
      id: 'hachiware',
      name: '하치와레',
      score: 20,                 // 20점
      probability: 0.30,         // 30% 확률
      stayMultiplier: 0.78,      // 보통 속도 (78%)
      className: 'char-hachiware',
      hitSoundFreq: 680,
      hitClass: 'score-20',
      svg: `
        <svg class="char-svg" viewBox="0 0 120 130" xmlns="http://www.w3.org/2000/svg">
          <path d="M22 56 L34 26 L48 48 Z" fill="#5BA4E6" stroke="#3B82F6" stroke-width="2" stroke-linejoin="round"/>
          <path d="M98 56 L86 26 L72 48 Z" fill="#5BA4E6" stroke="#3B82F6" stroke-width="2" stroke-linejoin="round"/>
          <ellipse cx="60" cy="80" rx="46" ry="44" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2.5"/>
          <path d="M16 75 C16 48 30 36 60 48 C90 36 104 48 104 75 C104 68 85 45 60 58 C35 45 16 68 16 75 Z" fill="#5BA4E6"/>
          <ellipse cx="32" cy="76" rx="8" ry="5.5" fill="#FFAEBC" opacity="0.8"/>
          <ellipse cx="88" cy="76" rx="8" ry="5.5" fill="#FFAEBC" opacity="0.8"/>
          <g class="face-normal">
            <path d="M38 56 Q44 54 48 57" stroke="#334155" stroke-width="2.2" stroke-linecap="round" fill="none"/>
            <path d="M82 56 Q76 54 72 57" stroke="#334155" stroke-width="2.2" stroke-linecap="round" fill="none"/>
            <circle cx="43" cy="67" r="6" fill="#1E293B"/>
            <circle cx="41.5" cy="64.8" r="2.2" fill="#FFFFFF"/>
            <circle cx="44.8" cy="69" r="1.1" fill="#FFFFFF"/>
            <circle cx="77" cy="67" r="6" fill="#1E293B"/>
            <circle cx="75.5" cy="64.8" r="2.2" fill="#FFFFFF"/>
            <circle cx="78.8" cy="69" r="1.1" fill="#FFFFFF"/>
            <ellipse cx="60" cy="72" rx="1.6" ry="1.2" fill="#334155"/>
            <path d="M53 77 Q56.5 81 60 77 Q63.5 81 67 77" stroke="#334155" stroke-width="2.2" stroke-linecap="round" fill="none"/>
          </g>
          <g class="face-hit">
            <circle cx="43" cy="67" r="6.5" fill="#FFFFFF" stroke="#334155" stroke-width="2.5"/>
            <circle cx="43" cy="67" r="2" fill="#334155"/>
            <circle cx="77" cy="67" r="6.5" fill="#FFFFFF" stroke="#334155" stroke-width="2.5"/>
            <circle cx="77" cy="67" r="2" fill="#334155"/>
            <ellipse cx="60" cy="78" rx="4.5" ry="5.5" fill="#FF8A80" stroke="#E11D48" stroke-width="1.5"/>
            <path d="M86 52 Q90 56 88 60 Q84 60 84 56 Z" fill="#60A5FA"/>
          </g>
          <ellipse cx="36" cy="115" rx="9" ry="7" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.8"/>
          <ellipse cx="84" cy="115" rx="9" ry="7" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.8"/>
        </svg>
      `
    },
    {
      id: 'usagi',
      name: '우사기',
      score: 50,                 // 50점
      probability: 0.10,         // 10% 확률 (가장 드묾)
      stayMultiplier: 0.52,      // 번개처럼 짧게 머묾 (52% - 잡기 어려움)
      className: 'char-usagi',
      hitSoundFreq: 820,
      hitClass: 'score-50',
      svg: `
        <svg class="char-svg" viewBox="0 0 120 130" xmlns="http://www.w3.org/2000/svg">
          <g transform="rotate(-6 42 32)">
            <ellipse cx="42" cy="24" rx="9" ry="22" fill="#FFF176" stroke="#F6E05E" stroke-width="2"/>
            <ellipse cx="42" cy="24" rx="4.5" ry="14" fill="#FFD1DC"/>
          </g>
          <g transform="rotate(6 78 32)">
            <ellipse cx="78" cy="24" rx="9" ry="22" fill="#FFF176" stroke="#F6E05E" stroke-width="2"/>
            <ellipse cx="78" cy="24" rx="4.5" ry="14" fill="#FFD1DC"/>
          </g>
          <ellipse cx="60" cy="80" rx="46" ry="44" fill="#FFF176" stroke="#F6E05E" stroke-width="2.5"/>
          <ellipse cx="32" cy="76" rx="8" ry="5.5" fill="#FF8A80" opacity="0.85"/>
          <ellipse cx="88" cy="76" rx="8" ry="5.5" fill="#FF8A80" opacity="0.85"/>
          <g class="face-normal">
            <path d="M37 54 L46 56" stroke="#4A5568" stroke-width="2.2" stroke-linecap="round"/>
            <path d="M83 54 L74 56" stroke="#4A5568" stroke-width="2.2" stroke-linecap="round"/>
            <circle cx="43" cy="67" r="5.5" fill="#1E293B"/>
            <circle cx="41.5" cy="65" r="2" fill="#FFFFFF"/>
            <circle cx="77" cy="67" r="5.5" fill="#1E293B"/>
            <circle cx="75.5" cy="65" r="2" fill="#FFFFFF"/>
            <ellipse cx="60" cy="71" rx="1.6" ry="1.2" fill="#334155"/>
            <path d="M53 76 L60 83 L67 76" stroke="#334155" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          </g>
          <g class="face-hit">
            <path d="M43 67 m -5, 0 a 5,5 0 1,0 10,0 a 3,3 0 1,0 -6,0 a 1,1 0 1,0 2,0" stroke="#334155" stroke-width="1.8" fill="none" stroke-linecap="round"/>
            <path d="M77 67 m -5, 0 a 5,5 0 1,0 10,0 a 3,3 0 1,0 -6,0 a 1,1 0 1,0 2,0" stroke="#334155" stroke-width="1.8" fill="none" stroke-linecap="round"/>
            <ellipse cx="60" cy="78" rx="6" ry="4" fill="#FF8A80" stroke="#E11D48" stroke-width="1.5"/>
          </g>
          <ellipse cx="36" cy="115" rx="9" ry="7" fill="#FFF176" stroke="#F6E05E" stroke-width="1.8"/>
          <ellipse cx="84" cy="115" rx="9" ry="7" fill="#FFF176" stroke="#F6E05E" stroke-width="1.8"/>
        </svg>
      `
    }
  ];

  // 초기 구멍에 캐릭터 렌더링
  function setupHoleCharacters() {
    holes.forEach((hole, idx) => {
      const spriteWrap = hole.querySelector('.char-sprite-wrap');
      const target = hole.querySelector('.character-target');
      const char = CHARACTERS[idx % CHARACTERS.length];
      target.className = `character-target ${char.className}`;
      target.dataset.charId = char.id;
      target.dataset.score = char.score;
      target.dataset.hitClass = char.hitClass;
      target.dataset.hitFreq = char.hitSoundFreq;
      target.dataset.stayMult = char.stayMultiplier;
      spriteWrap.innerHTML = char.svg;
    });
  }

  // --- Web Audio API 사운드 시스템 ---
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  // 타격음 (점수가 높을수록 더 신나고 높은 톤)
  function playHitSound(freq = 580, isSpecial = false) {
    if (!isSoundEnabled || !audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = isSpecial ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.14);

      gain.gain.setValueAtTime(isSpecial ? 0.42 : 0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.14);

      // 우사기(50점) 타격 시 추가 챠랑~ 효과음
      if (isSpecial) {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(1200, now + 0.05);
        osc2.frequency.exponentialRampToValueAtTime(1600, now + 0.18);
        gain2.gain.setValueAtTime(0.2, now + 0.05);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.start(now + 0.05);
        osc2.stop(now + 0.2);
      }
    } catch (e) {}
  }

  function playPopSound() {
    if (!isSoundEnabled || !audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(540, now + 0.08);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {}
  }

  function playStartSound() {
    if (!isSoundEnabled || !audioCtx) return;
    try {
      const notes = [392, 523.25, 659.25, 783.99];
      const now = audioCtx.currentTime;
      notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        gain.gain.setValueAtTime(0.18, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.07 + 0.14);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.14);
      });
    } catch (e) {}
  }

  function playTickSound() {
    if (!isSoundEnabled || !audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {}
  }

  function playGameOverSound() {
    if (!isSoundEnabled || !audioCtx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      const now = audioCtx.currentTime;
      notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        gain.gain.setValueAtTime(0.24, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.12 + 0.32);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.32);
      });
    } catch (e) {}
  }

  // --- 난이도별 최고 점수 로컬스토리지 관리 (요구사항 6번) ---
  function getDifficultyStorageKey(diff) {
    return DIFFICULTY_CONFIG[diff].storageKey;
  }

  function loadHighScore() {
    const key = getDifficultyStorageKey(currentDifficulty);
    const saved = localStorage.getItem(key);
    let best = 0;
    if (saved !== null && !isNaN(parseInt(saved, 10))) {
      best = parseInt(saved, 10);
    }
    highScoreEl.textContent = best;
    highScoreDiffLabel.textContent = DIFFICULTY_CONFIG[currentDifficulty].name;
    return best;
  }

  function saveHighScoreIfNew(newScore) {
    const key = getDifficultyStorageKey(currentDifficulty);
    const currentBest = loadHighScore();
    if (newScore > currentBest) {
      localStorage.setItem(key, newScore.toString());
      highScoreEl.textContent = newScore;
      return true;
    }
    return false;
  }

  // --- 무작위 구멍 선택 (직전 구멍 중복 방지) ---
  function getRandomHoleIndex(exclude = -1) {
    let randIndex;
    let attempts = 0;
    do {
      randIndex = Math.floor(Math.random() * holes.length);
      attempts++;
    } while ((randIndex === lastHoleIndex || randIndex === exclude) && attempts < 15);

    lastHoleIndex = randIndex;
    return randIndex;
  }

  // --- 등장 확률 적용 캐릭터 선택 (요구사항 2번: 치이카와 60%, 하치와레 30%, 우사기 10%) ---
  function getRandomCharacter() {
    const rand = Math.random(); // 0 <= rand < 1.0
    if (rand < 0.60) {
      return CHARACTERS[0]; // 치이카와: 60%
    } else if (rand < 0.90) {
      return CHARACTERS[1]; // 하치와레: 30%
    } else {
      return CHARACTERS[2]; // 우사기: 10%
    }
  }

  // --- 난이도별 기본 가속 알고리즘 ---
  function getSpeedSettings() {
    const config = DIFFICULTY_CONFIG[currentDifficulty];
    const elapsed = gameDuration - timeLeft;
    const progress = Math.min(1, Math.max(0, elapsed / gameDuration));

    const baseStay = Math.round(config.baseStay - progress * (config.baseStay - config.minStay));
    const delayTime = Math.round(config.baseDelay - progress * (config.baseDelay - config.minDelay));
    return { baseStay, delayTime, multiChance: config.multiSpawnChance };
  }

  // --- 단일 구멍에 캐릭터 팝업 (캐릭터별 체류 시간 차등 적용 - 요구사항 1, 4번) ---
  function spawnMoleInHole(holeIndex) {
    const hole = holes[holeIndex];
    const target = hole.querySelector('.character-target');
    const spriteWrap = hole.querySelector('.char-sprite-wrap');

    // 확률에 따라 캐릭터 선택
    const char = getRandomCharacter();
    target.className = `character-target ${char.className}`;
    target.dataset.charId = char.id;
    target.dataset.score = char.score;
    target.dataset.hitClass = char.hitClass;
    target.dataset.hitFreq = char.hitSoundFreq;
    target.dataset.stayMult = char.stayMultiplier;
    spriteWrap.innerHTML = char.svg;

    hole.dataset.isHit = 'false';
    target.classList.remove('hit');
    hole.classList.add('up');
    playPopSound();

    const { baseStay } = getSpeedSettings();
    // 캐릭터별 고유 체류 시간 계산 (우사기는 stayMultiplier가 0.52이므로 현저히 빨리 사라짐!)
    const charStayTime = Math.round(baseStay * char.stayMultiplier);

    setTimeout(() => {
      if (hole.classList.contains('up') && hole.dataset.isHit !== 'true') {
        hole.classList.remove('up');
      }
    }, charStayTime);
  }

  // 캐릭터 팝업 루프 (어려움/보통 모드 다중 출현)
  function popMole() {
    if (!isGameActive) return;

    const holeIndex1 = getRandomHoleIndex();
    spawnMoleInHole(holeIndex1);

    const { delayTime, multiChance } = getSpeedSettings();

    if (Math.random() < multiChance) {
      setTimeout(() => {
        if (!isGameActive) return;
        const holeIndex2 = getRandomHoleIndex(holeIndex1);
        spawnMoleInHole(holeIndex2);
      }, 120);
    }

    if (isGameActive) {
      moleTimerTimeout = setTimeout(popMole, delayTime + 480);
    }
  }

  // --- 타격 시각 효과 (+10점!, +20점!, +50점! 플로팅 텍스트 & 스파크 - 요구사항 3번) ---
  function showHitEffects(hole, text, hitClass, isUsagi = false) {
    const floating = document.createElement('div');
    floating.className = `floating-score ${hitClass}`;
    floating.textContent = text;
    hole.appendChild(floating);

    const spark = document.createElement('div');
    spark.className = isUsagi ? 'hit-spark gold-spark' : 'hit-spark';
    hole.appendChild(spark);

    setTimeout(() => {
      floating.remove();
      spark.remove();
    }, 750);
  }

  // --- 캐릭터 클릭/터치 이벤트 (중복 클릭 완벽 방지 & 차등 점수 반영 - 요구사항 3, 7번) ---
  function handleCharacterHit(e) {
    // 게임 비활성 상태이거나 종료 후 클릭 시 점수 추가 방지
    if (!isGameActive) return;

    if (e.type === 'touchstart') {
      e.preventDefault();
    }

    const target = e.currentTarget;
    const hole = target.closest('.hole');

    // 이미 잡힌 상태이거나 아직 올라오지 않은 구멍이면 무시
    if (!hole.classList.contains('up') || hole.dataset.isHit === 'true') {
      return;
    }

    // 1. 즉시 타격 플래그 설정 (연타 중복 점수 획득 차단)
    hole.dataset.isHit = 'true';
    target.classList.add('hit');

    // 2. 캐릭터별 차등 점수 획득
    const charScore = parseInt(target.dataset.score || '10', 10);
    const charId = target.dataset.charId || 'chiikawa';
    const hitClass = target.dataset.hitClass || 'score-10';
    const freq = parseInt(target.dataset.hitFreq || '580', 10);
    const isUsagi = (charId === 'usagi');

    score += charScore;
    molesWhackedCount += 1;
    charWhackedCounts[charId] = (charWhackedCounts[charId] || 0) + 1;
    currentScoreEl.textContent = score;

    // 3. 사운드 및 차등 점수 플로팅 효과 (+10점!, +20점!, +50점!)
    playHitSound(freq, isUsagi);
    showHitEffects(hole, `+${charScore}점!`, hitClass, isUsagi);

    // 4. 피격 표정 후 자연스럽게 구멍으로 퇴장
    setTimeout(() => {
      hole.classList.remove('up');
      target.classList.remove('hit');
    }, 220);
  }

  // --- 타이머 업데이트 ---
  function updateTimerDisplay() {
    timeLeftEl.textContent = timeLeft;
    const progressPercent = (timeLeft / gameDuration) * 100;
    timerProgressBar.style.width = `${progressPercent}%`;

    if (timeLeft <= 5) {
      timerCard.classList.add('danger');
      if (timeLeft > 0) {
        playTickSound();
      }
    } else {
      timerCard.classList.remove('danger');
    }
  }

  function startTimer() {
    timeLeft = gameDuration;
    updateTimerDisplay();

    timerInterval = setInterval(() => {
      timeLeft--;
      updateTimerDisplay();

      if (timeLeft <= 0) {
        endGame();
      }
    }, 1000);
  }

  // --- 게임 시작 함수 ---
  function startGame() {
    initAudio();
    playStartSound();

    isGameActive = true;
    score = 0;
    molesWhackedCount = 0;
    charWhackedCounts = { chiikawa: 0, hachiware: 0, usagi: 0 };
    currentScoreEl.textContent = score;
    lastHoleIndex = -1;

    // UI 상태 세팅
    startBtn.disabled = true;
    startBtn.querySelector('.btn-text').textContent = '친구들을 잡는 중...';
    gameNotice.textContent = '치이카와(10), 하치와레(20), 우사기(50)를 잡아보세요! 💥';
    gameNotice.classList.add('playing');

    // 난이도 버튼 잠금
    diffBtns.forEach(btn => btn.disabled = true);

    // 구멍 리셋
    holes.forEach(hole => {
      hole.classList.remove('up');
      hole.dataset.isHit = 'false';
      const target = hole.querySelector('.character-target');
      target.classList.remove('hit');
    });

    startTimer();
    setTimeout(popMole, 380);
  }

  // --- 결과 피드백 메시지 생성 ---
  function getResultFeedback(finalScore) {
    if (finalScore >= 300) {
      return {
        badge: '👑',
        title: '전설의 치이카와 마스터!',
        emoji: '💖',
        comment: '와아앗-! 우사기까지 모두 낚아채는 환상적인 실력에 모두가 감탄했어요!'
      };
    } else if (finalScore >= 180) {
      return {
        badge: '🌟',
        title: '날쌘 번개 친구!',
        emoji: '⚡',
        comment: '대단해요! 하치와레와 우사기도 깜짝 놀란 눈부신 반사신경이에요!'
      };
    } else if (finalScore >= 90) {
      return {
        badge: '🌸',
        title: '제법 날렵한 친구 사냥꾼!',
        emoji: '🌿',
        comment: '훌륭해요! 조금만 더 우사기를 노리면 200점 돌파도 쉬울 거예요!'
      };
    } else {
      return {
        badge: '🌱',
        title: '느긋한 힐링 친구!',
        emoji: '🐾',
        comment: '친구들이 신나게 뛰놀다 갔어요. 우사기를 집중 공략해 다시 도전해보세요!'
      };
    }
  }

  // --- 게임 종료 처리 (요구사항 6, 7번: 최종 점수, 선택한 난이도, 세부 내역 표시) ---
  function endGame() {
    isGameActive = false;
    clearInterval(timerInterval);
    clearTimeout(moleTimerTimeout);

    holes.forEach(hole => {
      hole.classList.remove('up');
    });

    playGameOverSound();

    startBtn.disabled = false;
    startBtn.querySelector('.btn-text').textContent = '게임 다시하기';
    gameNotice.textContent = '귀여운 친구들을 잡아보자!';
    gameNotice.classList.remove('playing');
    timerCard.classList.remove('danger');

    // 난이도 버튼 잠금 해제
    diffBtns.forEach(btn => btn.disabled = false);

    // 난이도별 최고 점수 갱신 여부
    const isNewRecord = saveHighScoreIfNew(score);

    // 모달창 데이터 세팅 (선택한 난이도 및 점수별 집계)
    modalDifficultyBadge.textContent = `플레이 난이도: ${DIFFICULTY_CONFIG[currentDifficulty].badgeText}`;
    modalFinalScore.textContent = `${score}점`;
    modalMolesWhacked.textContent = `${molesWhackedCount}마리`;

    // 캐릭터별 세부 포획 현황 및 획득 점수
    const cCount = charWhackedCounts.chiikawa || 0;
    const hCount = charWhackedCounts.hachiware || 0;
    const uCount = charWhackedCounts.usagi || 0;
    bdChiikawaCount.textContent = `${cCount}마리 (+${cCount * 10}점)`;
    bdHachiwareCount.textContent = `${hCount}마리 (+${hCount * 20}점)`;
    bdUsagiCount.textContent = `${uCount}마리 (+${uCount * 50}점)`;

    const feedback = getResultFeedback(score);
    modalBadge.textContent = feedback.badge;
    modalTitle.textContent = feedback.title;
    modalComment.textContent = feedback.comment;
    commentEmoji.textContent = feedback.emoji;

    if (isNewRecord && score > 0) {
      newRecordBanner.style.display = 'block';
    } else {
      newRecordBanner.style.display = 'none';
    }

    setTimeout(() => {
      resultModal.classList.add('active');
    }, 400);
  }

  function closeModal() {
    resultModal.classList.remove('active');
  }

  // --- 난이도 선택 이벤트 ---
  diffBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (isGameActive) return;

      diffBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      currentDifficulty = btn.dataset.difficulty;
      gameDuration = DIFFICULTY_CONFIG[currentDifficulty].duration;
      timeLeft = gameDuration;
      updateTimerDisplay();

      // 난이도 변경 시 해당 난이도의 최고 점수 즉시 표시 (요구사항 6번)
      loadHighScore();
    });
  });

  // --- 컨트롤 이벤트 리스너 ---
  startBtn.addEventListener('click', startGame);

  restartBtn.addEventListener('click', () => {
    closeModal();
    setTimeout(startGame, 300);
  });

  closeModalBtn.addEventListener('click', closeModal);

  resultModal.addEventListener('click', (e) => {
    if (e.target === resultModal) {
      closeModal();
    }
  });

  resetScoreBtn.addEventListener('click', () => {
    const diffName = DIFFICULTY_CONFIG[currentDifficulty].name;
    if (confirm(`현재 [${diffName}] 난이도의 최고 점수를 초기화하시겠습니까?`)) {
      localStorage.removeItem(getDifficultyStorageKey(currentDifficulty));
      loadHighScore();
      alert(`[${diffName}] 난이도의 최고 점수가 초기화되었습니다.`);
    }
  });

  soundToggleBtn.addEventListener('click', () => {
    initAudio();
    isSoundEnabled = !isSoundEnabled;
    if (isSoundEnabled) {
      soundToggleBtn.classList.remove('muted');
      soundIcon.textContent = '🔊';
      soundToggleBtn.querySelector('.sound-text').textContent = '소리 켬';
    } else {
      soundToggleBtn.classList.add('muted');
      soundIcon.textContent = '🔇';
      soundToggleBtn.querySelector('.sound-text').textContent = '소리 끔';
    }
  });

  // 각 구멍 캐릭터 타겟에 클릭 및 터치 이벤트 연결
  document.querySelectorAll('.character-target').forEach(target => {
    target.addEventListener('click', handleCharacterHit);
    target.addEventListener('touchstart', handleCharacterHit, { passive: false });
  });

  // 초기 캐릭터 렌더링, 최고 점수 로드 및 타이머 UI 설정
  setupHoleCharacters();
  loadHighScore();
  updateTimerDisplay();
});
