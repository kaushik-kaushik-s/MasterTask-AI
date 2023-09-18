const Sentiment = require('sentiment');
const sentiment = new Sentiment();
const cohere = require('cohere-ai');

cohere.init(''); // COHERE API KEY HERE

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


function mergeSortAssignments(assignments, skillLevels) {
    if (assignments.length <= 1) {
        return assignments;
    }

    const middleIndex = Math.floor(assignments.length / 2);
    const leftAssignments = assignments.slice(0, middleIndex);
    const rightAssignments = assignments.slice(middleIndex);

    const sortedLeftAssignments = mergeSortAssignments(leftAssignments, skillLevels);
    const sortedRightAssignments = mergeSortAssignments(rightAssignments, skillLevels);

    return mergeAssignments(sortedLeftAssignments, sortedRightAssignments, skillLevels);
}

function mergeAssignments(leftAssignments, rightAssignments, skillLevels) {
    let leftIndex = 0;
    let rightIndex = 0;
    const mergedAssignments = [];

    while (leftIndex < leftAssignments.length && rightIndex < rightAssignments.length) {
        const leftAssignment = leftAssignments[leftIndex];
        const rightAssignment = rightAssignments[rightIndex];

        const subjectA = leftAssignment.subject;
        const subjectB = rightAssignment.subject;
        const skillLevelA = skillLevels[subjectA] || 50;
        const skillLevelB = skillLevels[subjectB] || 50;
        const timeLeftA = leftAssignment.dueDate - new Date().getTime();
        const timeLeftB = rightAssignment.dueDate - new Date().getTime();
        const cohereA = leftAssignment.difficulty;
        const cohereB = rightAssignment.difficulty;
        const difficultyA = (skillLevelA + timeLeftA * (1 - skillLevelA / 100)) * cohereA;
        const difficultyB = (skillLevelB + timeLeftB * (1 - skillLevelB / 100)) * cohereB;

        if (difficultyB < difficultyA) {
            mergedAssignments.push(leftAssignment);
            leftIndex++;
        } else {
            mergedAssignments.push(rightAssignment);
            rightIndex++;
        }
    }

    return mergedAssignments.concat(leftAssignments.slice(leftIndex)).concat(rightAssignments.slice(rightIndex));
}

function sortAssignmentsByDifficulty(assignments, skillLevels) {
    return mergeSortAssignments(assignments, skillLevels);
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

// The method below is to test the AI API. The same algorithm is used in my Master Task web application, but the implementation of this algorithm is different.  

// async function main() {  
//     const inputs = {
//         "English": "I'm not very good at writing essays.",
//         "Math": "Math has is my strong suit.",
//         "Science": "I don't really like science.",
//     };

//     global.skillLevels = getSkillLevels(inputs);
//     await addDifficultyToAssignments(assignments)
//     console.log(sortAssignmentsByDifficulty(assignments, skillLevels))
// }

// main()
