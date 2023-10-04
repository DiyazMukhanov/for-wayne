//ChatGPT testing
const { Configuration, OpenAIApi } = require('openai');
const catchAsync = require("../utils/catchAsync");

function generatePrompt(essay) {
    return `Check for mistakes in my text. Show me every mistake. Then write my text without mistakes in english. Use this example as a model for answering but use given text - "Ваши ошибки: rid - read (just an example, do not respond it)
    ...". Please note that "Ваши ошибки" shall be written in rusian language. ${essay}.`;
  }

const secretKey = 'sk-sdfQsdf0Sg6Wkwsdf7QEIfOmCQdsdfOKT3BlbkFJ7UR0dsfq6pEmzsMfMMAChUF';

const configuration = new Configuration({
    apiKey: secretKey,
  });

const openai = new OpenAIApi(configuration);

exports.essayComment = async (req, res, next) => {
    const essay = req.body.essay;
    try {
        const completion = await openai.createCompletion({
          model: "text-davinci-003",
          prompt: generatePrompt(essay),
          temperature: 0.6,
          max_tokens: 1000, 
        
        });
        res.status(200).json({ result: completion.data.choices[0].text });
      } catch(error) {
        
        if (error.response) {
          
          res.status(error.response.status).json(error.response.data);
        } else {
          console.error(`Error with OpenAI API request: ${error.message}`);
          res.status(500).json({
            error: {
              message: 'An error occurred during your request.',
            }
          });
        }
      }
}

