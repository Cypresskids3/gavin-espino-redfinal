import { randomItems } from "./random.js";
const makeText = document.querySelector(".make-text");
const imageBox = document.querySelector(".image-container");
const userInput = document.querySelector(".user-input");
const generatedImage = document.querySelector(".generated-image");
const submitButton = document.querySelector(".submit");
const checkButton = document.querySelector(".check");
const nextButton = document.querySelector(".next");

let currentRandomWord = null;
let globalBlob = null;

window.addEventListener("load", () => {
    currentRandomWord = getRandomWord();
    makeText.innerHTML = "make: " + currentRandomWord;
});

const getRandomWord = () => {
    let random = Math.random();
    let randomNumber = Math.floor(random * randomItems.length);
    let randomItem = randomItems[randomNumber];
    return randomItem;
}

submitButton.addEventListener("click", () => {
    checkButton.disabled = true;
    nextButton.disabled = true;
    submitButton.disabled = true;
    let submissionValue = userInput.value;
    if (checkForMatch(submissionValue) == false) {
        if (submissionValue != "") {
            generatedImage.src = "../image-loading.gif";
            let input = getUserInput();
            getImage({ "inputs": input }).then((blob) => {
                globalBlob = blob;
                const blobURL = URL.createObjectURL(blob);
                generatedImage.src = blobURL;
                checkButton.disabled = false;
                nextButton.disabled = false;
            });
        }
    }else{
        userInput.value = "";
        userInput.placeholder = "Do not use the given word."
        submitButton.disabled = false;
    }
})

nextButton.addEventListener("click", () => {
    currentRandomWord = getRandomWord();
    makeText.innerHTML = "Make: " + currentRandomWord;
    userInput.value = "";
    userInput.placeholder = "Type Here...";
    imageBox.style.backgroundImage = "";
    generatedImage.src = "";
    submitButton.disabled = false;
})

checkButton.addEventListener("click", async () => {
    submitButton.disabled = true;
    nextButton.disabled = true;
    checkButton.disabled = true;
    imageBox.style.backgroundImage = "url(../scanning.gif)";
    generatedImage.style.opacity = 0.5;
    
    let base64 = await toBase64(globalBlob);
    // console.log(base64)
    let publicURL = await uploadFile(base64);
    let imageDescription = await scanImage(publicURL);

    // console.log("Image description")

    if(imageDescription[0].generated_text.includes(currentRandomWord.toLowerCase())){
        console.log("Correct");
        nextButton.disabled = false;
    }else{
        console.log("Incorrect");
        console.log(imageDescription[0].generated_text)
        nextButton.disabled = false;
    }
    imageBox.style.backgroundImage = null;
});


async function getImage(data) {
    const response = await fetch(
        "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
        {
                 headers: {
        Authorization: "Bearer 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",
        "ContentType": 'application/json'
     },
            method: "POST",
            body: JSON.stringify(data),
        }
    );
    const result = await response.blob();
    return result;
}

const getUserInput = () => {
    return userInput.value;
}

function checkForMatch(inputValue){
    let inputToLowerCase = inputValue.toLowerCase();
    if(inputToLowerCase.includes(currentRandomWord.toLowerCase())){
        // console.log("match");
        return true;
    }else{
        // console.log("not Match")
        return false;
    }
}

function uploadFile(file){
    return new Promise((resolve,reject) => {
        const url = `https://api.cloudinary.com/v1_1/dmm8zr0az/upload`;
        const fd = new FormData();
        fd.append('upload_preset', 'jb97dxcc');
        fd.append('file', file);

        fetch(url, {
            method : 'POST',
            body : fd,
        })
        .then((response) => {
           return response.json();
        })
        .then((data) => {
            let url = data.secure_url;
            resolve(url);
        })
    });
    }

async function toBase64(blobURL){
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = function () {
            const base64 = reader.result;
            // console.log(base64)
            resolve(base64);
        };
        reader.readAsDataURL(blobURL);
    });
}

async function scanImage(image) {
	const response = await fetch(
		"https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-large",
		{
			headers: {
                     Authorization: "Bearer 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", 
                    "Content-Type": "application/json"
                },
			    method: "POST",
			    body: image,
		}
	);
	const result = await response.json();
	return result;
}
