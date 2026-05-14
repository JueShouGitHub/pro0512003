import WebView from 'react-native-webview';
import { useRef } from 'react';
import { BackHandler, Linking } from 'react-native';
import appsFlyer from 'react-native-appsflyer';
import DeviceInfo from 'react-native-device-info';

export default function BScreen({ data }: { data: any }) {
  const wvRef = useRef<WebView>(null);
  BackHandler.addEventListener('hardwareBackPress', () => {
    if (wvRef.current) {
      wvRef.current.goBack();
      return true;
    }
    return false;
  });

  // const config = new AdjustConfig(data.sdkKey, AdjustConfig.EnvironmentProduction);
  // config.setLogLevel(AdjustConfig.LogLevelVerbose);
  // Adjust.initSdk(config);
  
  // const options = {
  //   devKey: data.sdkKey,
  //   appId: "",
  //   isDebug: true,
  // };
  // appsFlyer.initSdk(options, (successResult) => {
  //   console.log(successResult);
  //   appsFlyer.logEvent("af_startapp", {});
  // }, (errorResult) => {
  //   console.log(errorResult);
  // });

  return (
    <WebView
      style={{ flex: 1 }}
      ref={wvRef}
      source={{ uri: data.toUrl }}
      injectedJavaScript={data.config}
      userAgent={DeviceInfo.getUserAgentSync() + ' ' + data.userAgent}
      onShouldStartLoadWithRequest={request => {
        if (request.url.includes('.apk')) {
          Linking.openURL(request.url);
          return false;
        }
        return true;
      }}
      onMessage={async event => {
        const d = JSON.parse(event.nativeEvent.data);
        console.log(d);
        if (d['event'] == 'openWindow') {
          await Linking.openURL(d['params']['url']);
        } else {
          appsFlyer.logEvent(d['event'], d['params']);
        }
      }}
    ></WebView>
  );
}
