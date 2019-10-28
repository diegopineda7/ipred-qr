import React, { Component } from 'react';
import { AppRegistry, View, Image, StyleSheet, Linking, TouchableOpacity, Text, Modal, Alert } from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      modalExito: false,
      modalVacio: false,
      texto: '',
      nombre: '',
      cedula: '',
      enlaceRecibo: '',
      fila: '',
      // url: 'http://10.14.45.9:3000',
      url: 'http://200.16.118.25/chatbot'
    };
  }

  setModalExitoVisible(visible) {
    this.setState({modalExito: visible});
  }

  setModalVacioVisible(visible) {
    this.setState({modalVacio: visible});
  }

  leerCodigo = async code => {
    const consulta = await this.verificarRegistro(code.data);
    if (consulta.vacio) this.setState({
      texto: consulta.vacio,
      cedula: code.data
    });
    else {
      this.setState({
        texto: `${this.formatearNombre(consulta.nombres + ' ' + consulta.apellidos)} con ${consulta.tipoDocumento.toLowerCase()} número ${consulta.numeroDocumento}.`,
        nombre: `${this.formatearNombre(consulta.nombres + ' ' + consulta.apellidos)}`,
        cedula: consulta.numeroDocumento,
        enlaceRecibo: consulta.enlaceRecibo,
        fila: consulta.fila
      });
    } 
    this.state.enlaceRecibo === '' ? this.setModalVacioVisible(true) : this.setModalExitoVisible(true);
    await this.verificarRegistro(code.data);
  }

  leerNuevoCodigo = () => {
    this.setState({
      modalExito: false,
      modalVacio: false,
      texto: '',
      nombre: '',
      cedula: '',
      enlaceRecibo: '',
      fila: ''
    });
    this.scanner.reactivate();
  }

  verificarRegistro = async cedula => {
    var respuesta = {};
    await fetch(`${this.state.url}/consultar`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cedula
      }),
    })
      .then(response => response.json())
      .then(responseJson => {
        respuesta = responseJson;
      })
    return respuesta;
  }

  registrarAsistencia = async () => {
    await fetch(`${this.state.url}/asistencia`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fila: this.state.fila
      }),
    })
      .then(response => response.json())
      .then(res => {
        Alert.alert(
          'Asistencia',
          `Se registró la asistencia de ${this.state.nombre}. Jornada del ${res.jornada} ${res.fecha}.`,
          [
            {text: 'Cerrar', style: 'cancel'},
            {
              text: 'Leer nuevo código',
              onPress: () => {
                this.leerNuevoCodigo();
              },
              style: 'default'
            }
          ]
        );
      });
  }

  formatearNombre = nombre => {
    const tokens = nombre.toLowerCase().split(' ');
    var nombreFormateado = '';
    for (let i = 0; i < tokens.length - 1; i++) {
      nombreFormateado += tokens[i].charAt(0).toUpperCase() + tokens[i].slice(1) + ' ';
    }
    nombreFormateado += tokens[tokens.length - 1].charAt(0).toUpperCase() + tokens[tokens.length - 1].slice(1);
    return nombreFormateado;
  }

  render() {
    return (
      <View  style = {styles.container}>
        {/* Registro encontrado en el documento de Drive */}
        <Modal
          style = {styles.modal}
          animationType = 'slide'
          transparent = {false}
          visible = {this.state.modalExito}
        >
          <View style = {styles.modal}>
            <Text style = {styles.titulo}>Lectura exitosa</Text>
            <Text style = {styles.respuesta}>{this.state.texto}</Text>
            <Text
              style = {styles.enlace}
              onPress={() => Linking.openURL(`${this.state.enlaceRecibo}`)}
            >Ver recibo de pago</Text>
            <TouchableOpacity
              style = {styles.botonVolver}
              onPress = {async () => {
                await this.registrarAsistencia();
              }}
            >
              <Text style = {styles.botonVolverText}>Registrar asistencia</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style = {styles.botonVolver}
              onPress = {() => {
                this.leerNuevoCodigo();
              }}
            >
              <Text style = {styles.botonVolverText}>Leer nuevo código</Text>
            </TouchableOpacity>
          </View>
        </Modal>
        {/* No se encontró registro en el documento de Drive */}
        <Modal
          style = {styles.modal}
          animationType = 'slide'
          transparent = {false}
          visible = {this.state.modalVacio}
        >
          <View style = {styles.modal}>
            <Text style = {styles.titulo}>No existe el registro</Text>
            <Text style = {styles.respuesta}>{this.state.texto}</Text>
            <TouchableOpacity
              style = {styles.botonVolver}
              onPress = {() => Linking.openURL(`${this.state.url}/registrar`)}>
              <Text style = {styles.botonVolverText}>Crear registro</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style = {styles.botonVolver}
              onPress = {() => {
                this.leerNuevoCodigo();
              }}>
              <Text style = {styles.botonVolverText}>Leer nuevo código</Text>
            </TouchableOpacity>
          </View>
        </Modal>
        {/* Pantalla inicial de escaneo */}
        <View style = {styles.header}>
          <Image
            style = {styles.logo}
            source={require('./assets/logo_ipred.png')}
          />
          <Text style = {styles.textHeader}>Enfoque el código QR con la cámara para leerlo</Text>
        </View>
        <QRCodeScanner
          ref = {(node) => this.scanner = node}
          onRead = {code => this.leerCodigo(code)}
          showMarker = {true}
          markerStyle = {{
            borderColor: '#760765',
            borderRadius: 15
          }}
        />
      </View>
    );
  }
}
 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center'
  },
  header: {
    flexDirection: 'row',
    width: '100%',
    height: 100,
    backgroundColor: '#760765',
    alignItems: 'center',
    justifyContent: 'center'
  },
  logo: {
    width: 50,
    height: 50,
    marginRight: 10,
    borderRadius: 10
  },
  textHeader: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    maxWidth: '70%',
    textAlign: 'center'
  },
  modal: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  titulo: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#760765',
    marginTop: 20,
    textAlign: 'center'
  },
  respuesta: {
    fontSize: 20,
    paddingHorizontal: 20,
    marginTop: 45,
  },
  enlace: {
    fontSize: 20,
    fontWeight: 'bold',
    backgroundColor: 'blue',
    color: '#fff',
    padding: 5,
    marginTop: 25,
    height: 40,
    textAlign: 'center',
    width: '75%',
    borderRadius: 15
  },
  botonVolver: {
    backgroundColor: '#760765',
    marginTop: 25,
    height: 40,
    paddingHorizontal: 25,
    width: '75%',
    borderRadius: 15,
    justifyContent: 'center'
  },
  botonVolverText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center'
  }
});
 
AppRegistry.registerComponent('default', () => App);