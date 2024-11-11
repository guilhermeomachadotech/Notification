import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View , Button, Platform} from 'react-native';
import {useState, useEffect, useRef} from 'react';
//Realização da importação dos métodos para identifcar o aparelho e suas propriedades que está rodando o proejeto:
import * as Device from 'expo-device'
//Importação da biblioteca de Notification
import * as Notifications from 'expo-notifications';

import Constants from 'expo-constants';

//Configurações das notificações como seu alerta, som e badge
/**
 * Quando uma notificação é recebida enquanto o aplicativo está em execução, usando esta função você pode definir um retorno de chamada que decidirá se a notificação deve ser mostrada ao usuário ou não.

  Quando uma notificação é recebida, handleNotification é chamado com a notificação recebida como argumento. A função deverá responder com um objeto de comportamento em até 3 segundos, caso contrário, a notificação será descartada. Se a notificação for tratada com sucesso, handleSuccess será chamado com o identificador da notificação, caso contrário (ou no tempo limite) handleError será chamado
 */
Notifications.setNotificationHandler({
  handleNotification: async()=>({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge:false,
  })
  
})

export default function App() {
  const [expoPushToken, setExpoPushToke] = useState('');
  //A variável channel serve para identificar em qual canal a notificação entrará para poder ser executada e mostrada para o usuário

  const [notification, setNotification] = useState(false);

  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(()=>{
    registerForPushNotificationsAsync().then(token => setExpoPushToke(token));

    notificationListener.current = Notifications.addNotificationReceivedListener(notification=>{
      setNotification(notification)
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log(response);
    });
    
    return () =>{
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    }
  }, []);
  return (
    <View style={styles.container}>
      <Text>Seu expo push token: {expoPushToken}</Text>
      <View style={{alignItems: 'center', justifyContent: 'center'}}>
        <Text>Título: {notification && notification.request.content.title}</Text>
        <Text>Corpo: {notification && notification.request.content.body}</Text>
        <Text>Informações: {notification && JSON.stringify(notification.request.content.data)}</Text>
      </View>
      <Button title='Pressione para acionar a notificação' onPress={async()=>{
        
          await schedulePushNotification();
        
      }}></Button>
      <StatusBar style="auto" />
    </View>
  );
}

//Função que aciona a notificação e onde vai conter as informações da notificação

async function schedulePushNotification() {
  await Notifications.scheduleNotificationAsync({
    content:{
      //Aqui vai ser o título da notificação
      title: 'Você tem um novo email!!!',
      //O body é onde tem as informações detalhadas da notificação
      body: 'Aqui terá as informações detalhadas da notificação',
      //Data é onde executado a ação caso o usuário clicar na notificação
      data:{data: 'Aqui terá a ação a ser clicado na notificação'}
    },
    //O trigger é quanto tempo ele vai ser carregado para mostrar ao usuário
    trigger: {seconds: 2}
  });
}

//Aqui, essa função configurá o canal, o token, como sua permissão para enviar notificações e verificar se o aparelho é um celular

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    /**
     * sobre o setNotificationChannelAsync():
     * Assigns the channel configuration to a channel of a specified name (creating it if need be). This method lets you assign given notification channel to a notification channel group.
     */
    await Notifications.setNotificationChannelAsync('default',{
      name:'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C'
    });
  }

  if (Device.isDevice) {
    //Variável para guardar os status booleano se o usuário permitiu as notificações
    const {status: existingStatus} = await Notifications.getPermissionsAsync()

    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      /**
       * Prompts the user for notification permissions according to request. Request defaults to asking the user to allow displaying alerts, setting badge count and playing sounds.
       */
      const {status} = await Notifications.requestPermissionsAsync();
      finalStatus = status
    }
    if (finalStatus!=='granted') {
      alert('Não foi possível pegar o token para acionar a notificação!');
      return
    }
    //Configurando o token do Expo para poder executar a notificação
    try {
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      if (!projectId) {
        throw new Error('Id do Projeto não foi encontrado!');
      }

      /**
     * Sobre o método getExpoPushTokenAsync():
     * Returns an Expo token that can be used to send a push notification to the device using Expo's push notifications service.

      This method makes requests to the Expo's servers. It can get rejected in cases where the request itself fails (for example, due to the device being offline, experiencing a network timeout, or other HTTPS request failures). To provide offline support to your users, you should try/catch this method and implement retry logic to attempt to get the push token later, once the device is back online.
     */

    token = (await Notifications.getExpoPushTokenAsync({projectId: projectId})).data;
    console.log(token)
    }catch(e){
      token = `${e}`
    }
    
  }else{
    //Caso o aparelho que está rodando o projeto não seja compatível, retorne um erro em um alerta
    alert('Use um aparelho compátivel para poder utilizar a Notificação!!!')
  }
  return token;
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
