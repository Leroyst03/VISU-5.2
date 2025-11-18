require("dotenv").config();

exports.getVariables = (req, res) => {
  const numInputs = process.env.INPUTS;
  const numOutputs = process.env.OUTPUTS;
  const numBotones = process.env.NUM_BOTONES;

  return res.json({
    numInputs: Number(numInputs),
    numOutputs: Number(numOutputs),
    numBotones: Number(numBotones),
  });
};
