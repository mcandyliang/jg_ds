function video(object) {
  let url = `ezopen://open.ys7.com/${object}/1.hd.live`;
  return url;
}
function getvideo(id, accessToken, url) {
  var playr = new EZUIKit.EZUIKitPlayer({
    id: "id", // 视频容器ID
    audio: 0,
    accessToken: "accessToken",
    url: `ezopen://open.ys7.com/${url}/1.hd.live`,
    template: "simple", // simple - 极简版;standard-标准版;security - 安防版(预览回放);voice-语音版；
    autoplay: true,
    handleSuccess: (data = function () {
      console.log("播放成功回调", data);
    }),
    handleError: (data) => console.log("播放失败回调", data),
    handleTalkSuccess: () => console.log("对讲成功回掉"),
    handleTalkError: (data = function () {
      console.log("对讲失败", data);
    }),
    width: 200,
    height: 100,
    bSupporDoubleClickFull: true,
    env: {
      //domain: 'https://open.ys7.com',
      filePathDomain: "http://y.ys7.com:3100",
    },
  });
}
