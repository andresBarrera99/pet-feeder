import { Component } from '@angular/core';
import { environment } from '../../environments/environment'

import Amplify, { PubSub } from 'aws-amplify';
import { AWSIoTProvider } from '@aws-amplify/pubsub/lib/Providers';
import {UtilService} from '../services/util/util.service'


@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  
  tiempoEjecucion:Number;
  mensajeCuido:String = "";
  estadoSensor:Boolean = true;
  showActions:Boolean = false;
  device:any;
  estadoLamp1:Boolean = false;

  constructor(
    private util:UtilService
  ) {
    Amplify.configure({
      Auth: {
        identityPoolId: environment.IDENTITY_POOL_ID,
        region: environment.REGION,
        userPoolId: environment.USER_POOL_ID,
        userPoolWebClientId: environment.USER_POOL_WEB_CLIENT_ID
      }
    });

    Amplify.addPluggable(new AWSIoTProvider({
      aws_pubsub_region: environment.REGION,
      aws_pubsub_endpoint: environment.MQTT_HOST,
    }));

    PubSub.subscribe('esp8266/status').subscribe({
      next: data =>{
        const resp = data.value;
        console.log('Message received', resp);
        this.estadoSensor = resp.value ==1;
      } ,
      error: error => console.error(error),
      complete: () => console.log('Done'),
    });
    
    PubSub.subscribe('esp8266/response').subscribe({
      next: data => {
        const resp = data.value;
        if(resp.ok){
          this.util.dismissLoading();
          this.util.showSimpleMessage('Éxito','¡Tu mascota estará alimentada!');
          this.clear();
        }else{
          this.util.dismissLoading();
          this.util.showSimpleMessage('Error','Ocurrio un error alimentando tu mascota, por favor intenta nuevamente');
        }
        console.log('Message received', resp);
      },
      error: error => console.error(error),
      complete: () => console.log('Done'),
    });
  }

  clear(){
    this.tiempoEjecucion = undefined;
    this.showActions = false;
  }


  doAction(){
    if(this.tiempoEjecucion == undefined || this.tiempoEjecucion <= 0){
      this.util.showSimpleMessage('Validación','Debe ingresar el tiempo que debe estar activo el dispensador y debe ser mayor a 0');
    }else{
      PubSub.publish('esp8266/actions', { action: 1,delay:this.tiempoEjecucion });
      this.util.showLoading();
    }
    console.log('timempo ejecucion:',this.tiempoEjecucion)
  }  

}
