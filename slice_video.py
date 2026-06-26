import os
import cv2

def slice_video():
    video_path = "library.mp4"
    output_dir = os.path.join("public", "assets", "frames")
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    if not os.path.exists(video_path):
        print(f"Ошибка: Файл {video_path} не найден в корневом каталоге!")
        return

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"Ошибка: Не удалось открыть видеофайл {video_path}")
        return

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    print(f"Всего кадров в видео: {total_frames}")

    # Распределяем индексы кадров равномерно, чтобы получить ровно 120 кадров
    if total_frames < 120:
        print(f"Предупреждение: В видео всего {total_frames} кадров, это меньше 120. Некоторые кадры будут продублированы.")
        indices = [int(i * total_frames / 120) for i in range(120)]
    else:
        indices = [int(i * (total_frames - 1) / 119) for i in range(120)]

    for idx, frame_idx in enumerate(indices):
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
        ret, frame = cap.read()
        if not ret:
            print(f"Предупреждение: Не удалось прочитать кадр {frame_idx}. Пытаемся прочитать следующий.")
            ret, frame = cap.read()
            if not ret:
                continue

        # Получаем исходные размеры кадра
        h, w, _ = frame.shape

        # Кроп 7% по центру (сохраняем 93% по ширине и высоте)
        crop_h = int(h * 0.93)
        crop_w = int(w * 0.93)
        
        y1 = int((h - crop_h) / 2)
        x1 = int((w - crop_w) / 2)
        y2 = y1 + crop_h
        x2 = x1 + crop_w

        cropped_frame = frame[y1:y2, x1:x2]

        # Ресайз до 1920x1080 с использованием высококачественной интерполяции Lanczos
        resized_frame = cv2.resize(cropped_frame, (1920, 1080), interpolation=cv2.INTER_LANCZOS4)

        # Формируем имя файла frame_001.jpg ... frame_120.jpg
        output_file = os.path.join(output_dir, f"frame_{str(idx + 1).zfill(3)}.jpg")

        # Сохраняем в хорошем качестве JPEG (92%)
        cv2.imwrite(output_file, resized_frame, [int(cv2.IMWRITE_JPEG_QUALITY), 92])
        print(f"Обработан кадр {idx + 1}/120 (Индекс исходного кадра: {frame_idx})")

    cap.release()
    print("Нарезка кадров успешно завершена!")

if __name__ == "__main__":
    slice_video()
