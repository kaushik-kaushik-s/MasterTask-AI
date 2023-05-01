const Sentiment = require('sentiment');
const sentiment = new Sentiment();
const cohere = require('cohere-ai');

cohere.init('2Gch1kUNTV38FEWSjZoA01S8p51knS4qkvSH9XhJ');

function getSkillLevel(text) {
    const result = sentiment.analyze(text);
    let score = result.score;
    score = Math.min(Math.max(score, -5), 5);
    score = (score + 5) * 10;
    return Math.floor(score);
}

function getSkillLevels(inputs) {
    const skillLevels = {};
    for (let subject in inputs) {
        const sentences = inputs[subject].split('.');
        const scores = [];
        for (let sentence of sentences) {
            const score = getSkillLevel(sentence.trim());
            scores.push(score);
        }
        const averageScore = scores.reduce((total, score) => total + score, 0) / scores.length;
        skillLevels[subject] = Math.floor(averageScore);
    }
    return skillLevels;
}



function sortAssignmentsByDifficulty(assignments, skillLevels) {
    return assignments.sort((a, b) => {
        const subjectA = a.subject;
        const subjectB = b.subject;
        const skillLevelA = skillLevels[subjectA] || 50;
        const skillLevelB = skillLevels[subjectB] || 50;
        const timeLeftA = a.dueDate - new Date().getTime();
        const timeLeftB = b.dueDate - new Date().getTime();
        const cohereA = a.difficulty;
        const cohereB = b.difficulty;
        const difficultyA = (skillLevelA + timeLeftA * (1 - skillLevelA / 100)) * cohereA;
        const difficultyB = (skillLevelB + timeLeftB * (1 - skillLevelB / 100)) * cohereB;
        return difficultyB - difficultyA;
    });
}


global.assignments = [
    {
        subject: "English",
        name: "Essay on Rhetorical Devices",
        dueDate: new Date().setDate(new Date().getDate() + 1),
        "difficulty": 50
    },
    {
        subject: "Math",
        name: "Geometry problems",
        dueDate: new Date().setDate(new Date().getDate() + 2),
        "difficulty": 50
    },
    {subject: "Science", name: "Lab report", dueDate: new Date().setDate(new Date().getDate() + 3), "difficulty": 50},
    {
        subject: "Social Studies",
        name: "Timeline project",
        dueDate: new Date().setDate(new Date().getDate() + 2),
        "difficulty": 50
    },
    {
        subject: "Programming",
        name: "Debugging exercise",
        dueDate: new Date().setDate(new Date().getDate() + 1),
        "difficulty": 50
    },
];

async function addDifficultyToAssignments(assignments) {
    for (let i = 0; i < assignments.length; i++) {
        const assignment = assignments[i];
        const response = await cohere.classify({
            model: '00db5a51-e7cd-496e-bdbb-3254e2e1f306-ft',
            inputs: [assignment.name]
        })
        assignment.difficulty = parseInt(response.body.classifications[0].prediction)
    }
}

async function main() {
    const inputs = {
        "English": "I'm not very good at writing essays.",
        "Math": "Math has is my strong suit.",
        "Science": "I don't really like science.",
    };

    global.skillLevels = getSkillLevels(inputs);
    await addDifficultyToAssignments(assignments)
    return sortAssignmentsByDifficulty(assignments,skillLevels)
}

main()