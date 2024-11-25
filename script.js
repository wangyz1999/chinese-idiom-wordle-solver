// Fetch the dataset
let pinyinList = [];

fetch('idioms.json')
    .then(response => response.json())
    .then(data => {
        pinyinList = data.map(item => {
            const idiom = item.idiom;
            const pinyin = item.pinyin.trim().split(/\s+/).map(splitPinyinAsciiCorrected);
            return { idiom, pinyin };
        });
    })
    .catch(error => console.error('Error fetching data:', error));

// Tone marks mapping
const toneMarks = {
    'ā': 'a', 'á': 'a', 'ǎ': 'a', 'à': 'a',
    'ē': 'e', 'é': 'e', 'ě': 'e', 'è': 'e',
    'ī': 'i', 'í': 'i', 'ǐ': 'i', 'ì': 'i',
    'ō': 'o', 'ó': 'o', 'ǒ': 'o', 'ò': 'o',
    'ū': 'u', 'ú': 'u', 'ǔ': 'u', 'ù': 'u',
    'ǖ': 'ü', 'ǘ': 'ü', 'ǚ': 'ü', 'ǜ': 'ü',
    'ü': 'ü'
};

const toneNumberMap = {
    'ā': 1, 'á': 2, 'ǎ': 3, 'à': 4,
    'ē': 1, 'é': 2, 'ě': 3, 'è': 4,
    'ī': 1, 'í': 2, 'ǐ': 3, 'ì': 4,
    'ō': 1, 'ó': 2, 'ǒ': 3, 'ò': 4,
    'ū': 1, 'ú': 2, 'ǔ': 3, 'ù': 4,
    'ǖ': 1, 'ǘ': 2, 'ǚ': 3, 'ǜ': 4
};

// Standard initials
const initials = [
    "zh", "ch", "sh", "b", "p", "m", "f", "d", "t", "n", "l", "g", "k", "h",
    "j", "q", "x", "z", "c", "s", "r", "y", "w"
];

// Functions
function splitPinyinAsciiCorrected(pinyin) {
    const { pinyin: plainPinyin, tone } = decomposeTone(pinyin);
    for (let initial of initials) {
        if (plainPinyin.startsWith(initial)) {
            return [initial, plainPinyin.slice(initial.length), tone];
        }
    }
    return ["", plainPinyin, tone];
}

function decomposeTone(word) {
    for (let char of word) {
        if (toneMarks[char]) {
            const tone = toneNumberMap[char];
            word = word.replace(char, toneMarks[char]);
            return { pinyin: word, tone };
        }
    }
    return { pinyin: word, tone: 0 };
}

function solve(searchPattern, pinyinList) {
    const candidates = [];
    for (let { idiom, pinyin } of pinyinList) {
        try {
            if (checkPattern(searchPattern, idiom, pinyin)) {
                candidates.push(idiom);
            }
        } catch (error) {
            console.error('Error checking pattern for idiom:', idiom, error);
        }
    }
    return candidates;
}

function checkPattern(searchPattern, idiom, pinyin) {
    for (let i = 0; i < 4; i++) {
        // Fixed character
        if (searchPattern.fixed_char[i] && !searchPattern.fixed_char[i].includes(idiom[i])) {
            return false;
        }
        // Fixed initial
        if (searchPattern.fixed_prefixs[i] && pinyin[i][0] !== searchPattern.fixed_prefixs[i]) {
            return false;
        }
        // Fixed final
        if (searchPattern.fixed_suffixs[i] && pinyin[i][1] !== searchPattern.fixed_suffixs[i]) {
            return false;
        }
        // Fixed tone
        if (searchPattern.fixed_tones[i] && pinyin[i][2] !== searchPattern.fixed_tones[i]) {
            return false;
        }
        // Exclude initials
        if (searchPattern.exclude_initials.includes(pinyin[i][0])) {
            return false;
        }
        // Exclude finals
        if (searchPattern.exclude_suffixs.includes(pinyin[i][1])) {
            return false;
        }
        // Exclude tones
        if (searchPattern.exclude_tones.includes(pinyin[i][2])) {
            return false;
        }
    }
    // Include conditions
    if (searchPattern.include_char.length > 0 && !searchPattern.include_char.some(c => idiom.includes(c))) {
        return false;
    }
    if (searchPattern.include_prefixs.length > 0 && !searchPattern.include_prefixs.some(pref => pinyin.some(p => p[0] === pref))) {
        return false;
    }
    if (searchPattern.include_suffixs.length > 0 && !searchPattern.include_suffixs.some(suf => pinyin.some(p => p[1] === suf))) {
        return false;
    }
    if (searchPattern.include_tones.length > 0 && !searchPattern.include_tones.some(t => pinyin.some(p => p[2] === t))) {
        return false;
    }
    return true;
}

// Event Listeners
document.getElementById('searchBtn').addEventListener('click', search);
document.getElementById('resetBtn').addEventListener('click', reset);

function search() {
    const searchPattern = {
        fixed_prefixs: [],
        fixed_suffixs: [],
        fixed_tones: [],
        fixed_char: [],
        exclude_initials: [],
        exclude_suffixs: [],
        exclude_tones: [],
        include_prefixs: [],
        include_suffixs: [],
        include_tones: [],
        include_char: []
    };

    for (let i = 0; i < 4; i++) {
        searchPattern.fixed_prefixs[i] = document.getElementById(`prefix_${i}`).value.trim() || "";
        searchPattern.fixed_suffixs[i] = document.getElementById(`suffix_${i}`).value.trim() || "";
        const toneValue = document.getElementById(`tone_${i}`).value.trim();
        searchPattern.fixed_tones[i] = toneValue ? parseInt(toneValue) : "";
        searchPattern.fixed_char[i] = document.getElementById(`char_${i}`).value.trim() || "";
    }

    // Exclusions
    searchPattern.exclude_initials = document.getElementById('exclude_initials').value.split(',').map(s => s.trim()).filter(Boolean);
    searchPattern.exclude_suffixs = document.getElementById('exclude_suffixs').value.split(',').map(s => s.trim()).filter(Boolean);
    searchPattern.exclude_tones = document.getElementById('exclude_tones').value.split(',').map(s => parseInt(s.trim())).filter(Boolean);

    // Inclusions
    searchPattern.include_prefixs = document.getElementById('include_initials').value.split(',').map(s => s.trim()).filter(Boolean);
    searchPattern.include_suffixs = document.getElementById('include_suffixs').value.split(',').map(s => s.trim()).filter(Boolean);
    searchPattern.include_tones = document.getElementById('include_tones').value.split(',').map(s => parseInt(s.trim())).filter(Boolean);
    searchPattern.include_char = document.getElementById('include_char').value.split(',').map(s => s.trim()).filter(Boolean);

    // Get results
    const results = solve(searchPattern, pinyinList);

    // Display results
    const resultText = document.getElementById('resultText');
    resultText.value = '';
    if (results.length > 0) {
        resultText.value = results.join('\n');
    } else {
        resultText.value = 'No matches found.';
    }
}

function reset() {
    for (let i = 0; i < 4; i++) {
        document.getElementById(`prefix_${i}`).value = '';
        document.getElementById(`suffix_${i}`).value = '';
        document.getElementById(`tone_${i}`).value = '';
        document.getElementById(`char_${i}`).value = '';
    }
    document.getElementById('exclude_initials').value = '';
    document.getElementById('exclude_suffixs').value = '';
    document.getElementById('exclude_tones').value = '';
    document.getElementById('include_initials').value = '';
    document.getElementById('include_suffixs').value = '';
    document.getElementById('include_tones').value = '';
    document.getElementById('include_char').value = '';
    document.getElementById('resultText').value = '';
}
