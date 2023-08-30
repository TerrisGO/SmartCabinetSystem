import cv2
# initalize the cam
# setup text
font = cv2.FONT_HERSHEY_SIMPLEX
text = "Press Q to Exit"
text2 = "QR code scanner"

# get boundary of this text
textsize = cv2.getTextSize(text, font, 1, 2)[0]

cap = cv2.VideoCapture(0)
# initialize the cv2 QRCode detector
detector = cv2.QRCodeDetector()
while True:
    _, img = cap.read()
    # detect and decode
    data, bbox, _ = detector.detectAndDecode(img)
    # check if there is a QRCode in the image
    if bbox is not None:
        # display the image with lines
        for i in range(len(bbox)):
            # draw all lines
            cv2.line(img, tuple(bbox[i][0]), tuple(bbox[(i+1) % len(bbox)][0]), color=(255, 0, 0), thickness=2)
        if data:
            print(data)#"[+] QR Code detected, data:",
            break
    # display the result
        # get coords based on boundary
    textX = int((img.shape[1] - textsize[0]) / 2)
    textY = int((img.shape[0] + textsize[1]) / 2 + 190)
    textY2 = int((img.shape[0] + textsize[1]) / 2 - 190)

    # add text centered on image
    cv2.putText(img, text, (textX, textY ), font, 1, (255, 255, 255), 2)
    cv2.putText(img, text2, (textX, textY2 ), font, 1, (255, 255, 255), 2)
    cv2.namedWindow("img", cv2.WND_PROP_FULLSCREEN)
    cv2.setWindowProperty("img",cv2.WND_PROP_FULLSCREEN,cv2.WINDOW_FULLSCREEN)

    cv2.imshow("img", img)    
    if cv2.waitKey(1) == ord("q"):
        break
cap.release()
cv2.destroyAllWindows()