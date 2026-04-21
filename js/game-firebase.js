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

    async function submitScore(name, score) {
        const entry = {
            name: name || 'AAA',
            score: score,
            date: new Date().toISOString()
        };

        if (db) {
            try {
                await db.collection(COLLECTION).add({
                    name: entry.name,
                    score: entry.score,
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
        if (rankings.length > 50) rankings.length = 50;
        localStorage.setItem(LOCAL_KEY, JSON.stringify(rankings));
        return true;
    }

    async function fetchRanking(limit) {
        limit = limit || 10;

        if (db) {
            try {
                const snap = await db.collection(COLLECTION)
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
        rankings.sort((a, b) => b.score - a.score);
        return rankings.slice(0, limit);
    }

    return { init: init, submitScore: submitScore, fetchRanking: fetchRanking };
})();
