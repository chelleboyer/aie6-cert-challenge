# 🚀 Fine-Tuning Evaluation Report

This README documents the performance improvement achieved through fine-tuning an LLM on our specific domain task. We compared a **baseline model** against a **fine-tuned version** using the [Ragas](https://ragas.io) evaluation framework.

---

## 📊 Evaluation Dashboard Links

- **🔹 Baseline Results**: [View Dashboard](https://app.ragas.io/dashboard/alignment/testset/b0009f7a-3106-42fa-862b-4897d56d5cea)
- **🔸 Fine-Tuned Results**: [View Dashboard](https://app.ragas.io/dashboard/alignment/testset/22b0b9df-1f4d-410c-bb75-92ff7a4b73df)

---

## 📈 Metric Comparison Table

| **Metric**                         | **Baseline Model** | **Fine-Tuned Model** | **Change**         | **Interpretation**                                                                 |
|-----------------------------------|--------------------|----------------------|--------------------|------------------------------------------------------------------------------------|
| **Context Recall**                | 0.7000             | 0.9833               | **+0.2833**        | Huge boost — retrieves far more relevant context.                                  |
| **Faithfulness**                  | 0.8305             | 0.8269               | −0.0036            | Nearly identical — high fidelity maintained.                                       |
| **Factual Correctness (F1)**      | 0.3540             | 0.4408               | **+0.0868**        | Noticeable increase in factual accuracy.                                           |
| **Answer Relevancy**              | 0.4684             | 0.6212               | **+0.1528**        | Answers are significantly more aligned with the questions.                        |
| **Context Entity Recall**         | 0.0875             | 0.1927               | **+0.1052**        | Dramatic improvement in named entity recognition.                                 |
| **Noise Sensitivity (Relevant)**  | 0.2366             | 0.2293               | −0.0073            | Slight gain — better robustness to irrelevant context.                            |

---

## 🧠 Summary

Fine-tuning **dramatically improved** the model's ability to:
- Pull accurate context from relevant documents
- Retrieve entities correctly
- Provide more relevant and factually accurate answers

All without sacrificing faithfulness or increasing noise sensitivity.

---

## 🛠️ Next Steps

- ✅ Extend testing across more domains
- ⚙️ Experiment with different loss functions or dataset balances
- 📦 Package the fine-tuned model for downstream RAG applications

---
