from unsloth import FastLanguageModel
from datasets import load_dataset

# Load model
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name = "unsloth/llama-3-8b-bnb-4bit",
    max_seq_length = 2048,
    load_in_4bit = True,
)

# Apply LoRA
model = FastLanguageModel.get_peft_model(
    model,
    r = 16,
    target_modules = ["q_proj", "k_proj", "v_proj", "o_proj"],
    lora_alpha = 16,
    lora_dropout = 0,
)

# Load dataset
dataset = load_dataset("json", data_files="tatvam.jsonl")

def format_data(example):
    return {
        "text": f"### Instruction:\n{example['instruction']}\n### Response:\n{example['response']}"
    }

dataset = dataset.map(format_data)

# Train
from transformers import TrainingArguments, Trainer

trainer = Trainer(
    model = model,
    train_dataset = dataset["train"],
    args = TrainingArguments(
        per_device_train_batch_size = 2,
        gradient_accumulation_steps = 4,
        num_train_epochs = 3,
        learning_rate = 2e-4,
        fp16 = True,
        logging_steps = 10,
        output_dir = "tatvam_lora",
    ),
)

trainer.train()

# Save
model.save_pretrained("tatvam_lora")
tokenizer.save_pretrained("tatvam_lora")