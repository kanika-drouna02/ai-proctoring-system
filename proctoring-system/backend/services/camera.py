import cv2
import time

# Open the webcam (0 = default camera)
cap = cv2.VideoCapture(0)

# For FPS calculation
prev_time = time.time()

while True:
    # Read a frame from webcam
    ret, frame = cap.read()
    frame = cv2.flip(frame, 1)

    # If frame wasn't read successfully, skip
    if not ret:
        print("Camera not found!")
        break

    # Calculate FPS
    curr_time = time.time()
    fps = 1 / (curr_time - prev_time)
    prev_time = curr_time

    # Display FPS on the frame
    cv2.putText(frame, f'FPS: {fps:.1f}', (10, 30), 
                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

    # Show the frame in a window
    cv2.imshow('Proctoring Camera', frame)

    # Press 'q' to quit
    if cv2.waitKey(1) == ord('q'):
        break

# Clean up
cap.release()
cv2.destroyAllWindows()