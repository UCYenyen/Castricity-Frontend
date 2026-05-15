## Constraint Umum
1.Struktur File : Wajib mengumpulkan: proposal.pdf, training.ipynb
(dengan log terlihat), inference.ipynb (script bersih), file model
(.pt/.h5/dll), folder train_data, dan folder test_data secara
terpisah.
2.Reproducibility: Model boleh memanfaatkan GPU localhost
bawaan laptop peserta saat demo. Namun, model wajib tetap
dapat berjalan di lingkungan CPU-only dan memenuhi batas waktu
inferensi pada kondisi CPU (lihat C-A3). Juri memvalidasi
constraint kecepatan pada kondisi CPU, bukan GPU.
3.Bahasa Kode: Python adalah bahasa utama yang
direkomendasikan. Penggunaanw bahasa lain untuk komponen
tertentu diperbolehkan dengan dokumentasi yang jelas.
4.Larangan Cloud Inference: Dilarang menggunakan API inferensi
cloud (OpenAI, Google AI, AWS, Azure AI, Hugging Face Inference
API, dll) sebagai komponen inti model. Pelanggaran ini
mengakibatkan diskualifikasi.
5.Proposal Bab 3: Setiap tim wajib mendedikasikan Bab 3 proposal
untuk menjelaskan secara rinci bagaimana model mereka
memenuhi setiap poin constraint track masing-masing. Bab ini
akan menjadi dasar penilaian kepatuhan constraint.

## Time Series Constraints
Track C: The Explainable
Oracle (Predictive Analytics)
Track C: The Explainable
Oracle (Predictive Analytics)
Konteks Tantangan:
Model prediktif yang akurat namun tidak bisa menjelaskan
keputusannya adalah model yang tidak bisa dipercaya, terutama
dalam pengambilan keputusan kritis seperti kredit, diagnosis, atau
kebijakan publik. Track ini menguji kemampuan tim membangun
sistem prediktif yang presisi sekaligus transparan dan dapat
dipertanggungjawabkan.
Constraint:
1.Explainability Wajib: Model WAJIB menyertakan mekanisme
explainability yang dapat menjelaskan faktor-faktor penting di
balik setiap prediksi. Implementasi minimal menggunakan salah
satu dari: SHAP, LIME, feature importance plot, atau metode
interpretabilitas lain yang dapat dipertanggungjawabkan secara
ilmiah.
2.Output Penjelasan : Sistem wajib menghasilkan output penjelasan
yang dapat dibaca manusia (human-readable explanation) untuk
setiap prediksi, bukan hanya angka probabilitas. Penjelasan
minimal menyebutkan 3 variabel teratas yang memengaruhi hasil
prediksi beserta arah pengaruhnya (positif/negatif).
3.Anti-Black Box : Penggunaan model yang sepenuhnya opaque
(black box) tanpa lapisan explainability apapun tidak memenuhi
syarat. Jika menggunakan deep learning, wajib dilengkapi
mekanisme interpretasi yang valid (misal: attention weights, SHAP
deep explainer, Grad-CAM untuk tabular).
4.Validasi Data Leakage: Peserta wajib membuktikan tidak ada data
leakage antara train_data dan test_data. Pemisahan folder wajib
dilakukan sebelum preprocessing apapun, bukan setelahnya.
5.Offline Total: Seluruh proses inferensi dan explainability berjalan
secara offline (localhost). Tidak diperbolehkan menggunakan API
prediktif atau explainability dari layanan cloud eksternal.