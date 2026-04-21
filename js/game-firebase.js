// ===== Firebase ランキング =====
// Firebase未設定時はlocalStorageにフォールバック
const GameRanking = (function () {
    let db = null;
    const COLLECTION = 'rankings';
    const LOCAL_KEY = 'game_rankings';

    function init() {
        if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
            db = firebase.firestore();
        }
    }

    async function submitScore(name, score, difficulty) {
        const entry = {
            name: name || 'AAA',
            score: score,
            difficulty: difficulty || 'normal',
            date: new Date().toISOString()
        };

        if (db) {
            try {
                await db.collection(COLLECTION).add({
                    name: entry.name,
                    score: entry.score,
                    difficulty: entry.difficulty,
                    date: firebase.firestore.FieldValue.serverTimestamp()
                });
                return true;
            } catch (e) {
                console.warn('Firebase write failed, using localStorage', e);
            }
        }

        // localStorage fallback
        const rankings = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
        rankings.push(entry);
        rankings.sort((a, b) => b.score - a.score);
        if (rankings.length > 200) rankings.length = 200;
        localStorage.setItem(LOCAL_KEY, JSON.stringify(rankings));
        return true;
    }

    async function fetchRanking(difficulty, limit) {
        limit = limit || 10;
        difficulty = difficulty || 'normal';

        if (db) {
            try {
                const snap = await db.collection(COLLECTION)
                    .where('difficulty', '==', difficulty)
                    .orderBy('score', 'desc')
                    .limit(limit)
                    .get();
                return snap.docs.map(function (doc) {
                    var d = doc.data();
                    return { name: d.name, score: d.score };
                });
            } catch (e) {
                console.warn('Firebase read failed, using localStorage', e);
            }
        }

        // localStorage fallback
        const rankings = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
        return rankings
            .filter(r => r.difficulty === difficulty)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }

    return { init: init, submitScore: submitScore, fetchRanking: fetchRanking };
})();
