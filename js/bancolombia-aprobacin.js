var idUsuario = null;

$(function() {
     
    // Conexion con Backend Kinvey
    var  promiseInit = Kinvey.init({
        appKey    : 'kid_PPwwzftRG9',
        appSecret : 'a5f7bc254fea41da8364e4bc7064c096'
    });
 
    promiseInit.then(function(activeUser) {
         var promisePing = Kinvey.ping();
         promisePing.then(function(response) {
           console.log('Kinvey Ping Success. Kinvey Service is alive, version: ' + response.version + ', response: ' + response.kinvey);
         }, function(error) {
           console.log('Kinvey Ping Failed. Response: ' + error.description);
         });
     }, function(error) {
        loginError.text('Problemas conectando con el backend. Por favor intente mas tarde');
     });
	 
	 /************ login ************/
	var loginForm = $('#login_form');
	var loginError =  $('#login_error');
	console.log("Log In");
	loginForm.on('submit', function(e) {
		e.preventDefault();
		loginError.text('');
		$.mobile.loading('show');
		var usernameField = loginForm.find('[name="username"]');
		var username = $.trim(usernameField.val());
		var passwordField = loginForm.find('[name="password"]');
		var password = $.trim(passwordField.val());
		console.log("Autenticando usuario...");
		console.log(username);
		console.log(password);
		var user = Kinvey.getActiveUser();
		console.log(user);
		if(user != null) {
		    var promiseLogout = Kinvey.User.logout({
                success: function() {
                        console.log("Desconectando");
                    },
                    error: function(e) {
                        console.log("Usuario no conectado");
                    }
            });
            promiseLogout.then(function() {
                console.log("acabo de hacer logout..");
                console.log("then logout.");
            });
		}
		var promiseLogin = Kinvey.User.login(username, password, {
			success: function() {
				var esAprobador = false;
				console.log("Loggeado.");
				usernameField.val(''); //clear fields
				passwordField.val('');
				console.log("Redireccionando a Home.");
				var user = Kinvey.getActiveUser();
				var query = new Kinvey.Query();
				query.equalTo('IdUsuario', user._id);
				var query2 = new Kinvey.Query();
				query2.equalTo('Rol', 'APPROVER');
				query.and(query2);
				var promiseRoles = Kinvey.DataStore.find('UsuarioRol', query, {
					success: function(items) {
					   $.each(items, function(index, item) {
						  console.log("Es un usuario aprobador");
						  esAprobador = true;
						  console.log(item._id);
						  $.mobile.changePage("#List", {
								transition: "pop",
								reverse: false,
								changeHash: false
						});
						$.mobile.loading('hide');
					   });
					},
					error: function(e) {
						console.log("Problemas consultando roles de usuario");
						$.mobile.loading('hide');
					}
				});
				promiseRoles.then(function() {
					if(!esAprobador) {
						console.log("No es usuario aprobador..");
						idUsuario = user.username;
						console.log(idUsuario);
						nombreUsuario = user.first_name + ' ' + user.last_name;
						$.mobile.changePage("#solicitud", {
								transition: "pop",
								reverse: false,
								changeHash: false
						});
						$.mobile.loading('hide');
					}
				});
			},
			error: function(error){
				console.log(error);
				$.mobile.loading('hide');
				loginError.text('Por Favor Ingrese Un Usuario y Contrasena Validos');
			}
	  });
	  return false;
	});
            
	//Logout
	$("#logout").click(function () {
		showConfirmLogout();
	});
	
	//List Aprobaciones Page
	$(document).on("pageshow", "#List", function () {
		$.mobile.loading('show');
		$('#solicitudAnticiposList').empty();
		$('#solicitudAnticiposList').append('<li data-role="list-divider" role="heading">Solicitudes de anticipos de viaje</li>');
		var user = Kinvey.getActiveUser();
		console.log(user);
		var txtBienv = "<b>Bienvenido: " + user.first_name + " " + user.last_name+"</b>";
		$('#bienvenidaText').html(txtBienv);
		console.log(txtBienv);
		var query = new Kinvey.Query();
	    query.equalTo('Estado', "0");
		var promiseSolicitudes = Kinvey.DataStore.find('Solicitudes', query, {
			success: function(items) {
			   console.log("Consulta satisfactoria de solicitudes");
			   $.each(items, function(index, item) {
				  console.log(item._id);
				  $('#solicitudAnticiposList').append('<li data-theme="c"><a href="" data-transition="slide" data-id="' +item._id
				  + '">'+'<b class="highlight">Id Solicitud: </b> '+item.id_solicitud+'<br/><b class="highlight">Fecha de Inicio: </b>'+item.fecha_inicio+' <br><b class="highlight">Fecha Fin: </b> '+item.fecha_fin+
				  '<br> <b class="highlight">Valor del Anticipo:</b>  ' + formatNumber(item.Anticipo,'$') + '<br/><b class="highlight">Comentarios:</b>  ' + (item.comentarios != undefined ? item.comentarios : "") 
				  +'</a></li>');
			   });
			   $('#solicitudAnticiposList').listview('refresh');
			   $.mobile.loading('hide');
			},
			error: function(e) {
				console.log("Problemas consultando solicitudes");
				$.mobile.loading('hide');
			}
		});
	});
	
	var solicitudInfo = {
				id : null,
				data : null
	}
	
	$(document).on('vclick', '#solicitudAnticiposList li a', function(){
		solicitudInfo.id = $(this).attr('data-id');
		$.mobile.changePage( "#DetailApr", { transition: "slide", changeHash: false });
		$.mobile.loading('show');
		
		var query = new Kinvey.Query();
		query.equalTo('_id', solicitudInfo.id);
		var promiseFrontera = Kinvey.DataStore.find('Solicitudes', query, {
			 success: function(response) {
			   $.each(response, function(index, item) {
					solicitudInfo.data = item;
					console.log("Solicitud found: "+item._id);
					$("#dtFechaIni").val(item.fecha_inicio);
					$('#dtFechaIni').textinput('disable');
					$("#dtFechaFin").val(item.fecha_fin);
					$('#dtFechaFin').textinput('disable');
					$("#txtMonto").val(item.Anticipo);
					$('#txtMonto').textinput('disable');
					$("#comentariosTxt").val(item.comentarios);
					$('#comentariosTxt').textinput('disable');
					//$('#aprobarOpt').find("input[type='radio']:checked").removeAttr('checked');
					$("#aprobarOpt").attr('checked', false); 
					$("#infAdicionalTxt").val("");
					$.mobile.loading('hide');
			   });
			 }
		});
		
		promiseFrontera.then( function() {
			//Cargar Ciudades:
			var promise = Kinvey.DataStore.find('ciudades', null, {
						success: function(items) {
						   var list = $("#txtCiuOri");
						   var list2 = $("#txtCiuDesti");
						   $.each(items, function(index, item) {
							  list.append(new Option(item.ciudad, item.id_ciudad));
							  list2.append(new Option(item.ciudad, item.id_ciudad));
						   });
						}
			});
			promise.then( function() {
				$("#txtCiuOri").val(solicitudInfo.data.ciudad_origen).selectmenu('refresh');
				$('#txtCiuOri').selectmenu('disable');
				$("#txtCiuDesti").val(solicitudInfo.data.ciudad_destino).selectmenu('refresh');
				$('#txtCiuDesti').selectmenu('disable');
			});
			//Cargar actividad
			var promiseAct = Kinvey.DataStore.find('actividades', null, {
						success: function(items) {
						   var list = $("#cmbAprbActividad");
						   $.each(items, function(index, item) {
							  list.append(new Option(item.actividad, item.id_actividad));
						   });
						}
			});
			promiseAct.then( function() {
				$("#cmbAprbActividad").val(solicitudInfo.data.id_actividad).selectmenu('refresh');
				$('#cmbAprbActividad').selectmenu('disable');
			});
			//cargar clase de viaje
			var promiseClase = Kinvey.DataStore.find('claseViaje', null, {
						success: function(items) {
						   var list = $("#cmbAprbClase");
						   $.each(items, function(index, item) {
							  list.append(new Option(item.clase_viaje, item.id_claseviaje));
						   });
						}
			});
			promiseClase.then( function() {
				$("#cmbAprbClase").val(solicitudInfo.data.id_claseviaje).selectmenu('refresh');
				$('#cmbAprbClase').selectmenu('disable');
			});
			//cargar motivo
			var promiseMotivo = Kinvey.DataStore.find('motivos', null, {
						success: function(items) {
						   var list = $("#cmbAprbMotivo");
						   $.each(items, function(index, item) {
							  list.append(new Option(item.motivo, item.id_motivo));
						   });
						}
			});
			promiseMotivo.then( function() {
				$("#cmbAprbMotivo").val(solicitudInfo.data.id_motivo).selectmenu('refresh');
				$('#cmbAprbMotivo').selectmenu('disable');
			});
			//cargar monedas
			var promiseMoneda = Kinvey.DataStore.find('monedas', null, {
						success: function(items) {
						   var list = $("#txtMoneda");
						   $.each(items, function(index, item) {
							  list.append(new Option(item.moneda, item.id_moneda));
						   });
						}
			});
			promiseMoneda.then( function() {
				$("#txtMoneda").val(solicitudInfo.data.Moneda).selectmenu('refresh');
				$('#txtMoneda').selectmenu('disable');
			});
		});
	});
	
	
	$("#guardarSolBtn").click(function () {
	   var opcionSelected = $("#aprobarOpt :radio:checked").val();
	   var observaciones = $("#infAdicionalTxt").val();
       console.log("Aprobacion seleccionada: "+opcionSelected);
	   if(opcionSelected == null || opcionSelected == undefined) {
	     showAlert("Por Favor indique si aprueba o rechaza la solicitud","Error");
		 return null;
	   }
	   else if(observaciones == null || observaciones == undefined || observaciones == "") {
		 showAlert("Por Favor ingrese la informacion adicional","Error");
		 return null;
	   }
	   else {
	   console.log('_id:  '+ solicitudInfo.id); 
			 if(navigator.notification){
				navigator.notification.confirm(
				'Desea Registrar la informacion?',     
				doRegistrar,      
				'Registrar Aprobacion/Rechazo Solicitud',            
				['Cancelar','Registrar']
				);
			}
			else {
				var requerimiento = solicitudInfo.data;
				requerimiento.Estado = $("#aprobarOpt :radio:checked").val();
				requerimiento.DetalleAprobacion = $("#infAdicionalTxt").val();
				console.log(requerimiento);
				Kinvey.DataStore.update('Solicitudes', requerimiento, {
					success: function(response) {
						$.mobile.loading('hide');
						showAlert("Informacion Registrada con Exito","INFO");
						goHomeList();
						
					},
					error: function(error){
						console.log(error);
						alert(error);
						$.mobile.loading('hide');
					}
				});
			}
	   }
    });
	
	var doRegistrar = function(buttonIndex) {
	 if(buttonIndex == 2) {
	    var requerimiento = solicitudInfo.data;
		requerimiento.Estado = $("#aprobarOpt :radio:checked").val();
		requerimiento.DetalleAprobacion = $("#infAdicionalTxt").val();
		Kinvey.DataStore.update('Solicitudes', requerimiento, {
				    success: function(response) {
						$.mobile.loading('hide');
						navigator.notification.alert('Informacion Registrada con Exito',     
						goHomeList,      
						'Registrar Aprobacion/Rechazo Solicitud',
						'OK');
				    },
			        error: function(error){
						console.log(error);
						alert(error);
				        $.mobile.loading('hide');
					}
				});
	 }
	};
	
	var goHomeList = function() {
		$.mobile.changePage('#List');
	};
	
	
	//Inicio Insert
           
            $("#salir").on("click", function() {
                salir();
            });
            
            $("#salir2").on("click", function() {
                salir();
            });
            
            $("#salir3").on("click", function() {
                salir();
            });
            
            //Menu Page
            $(document).on("pageshow", "#solicitud", function () {
                consultarSolicitud();
            });
            
            $(document).on("pageshow", "#popup", function () {
				limpiarDetalle();
                consultarDetalle();
            });
            
            $(document).on("pageshow", "#solicitudanticipo", function () {
                limpiarFormulario();
                cargarPaisesO('');
                cargarPaisesD('');
                cargarMonedas('');
                cargarClaseViajes();
                cargarActividades();
                cargarMotivos();
            });
            
            $('#pais_origen').change(function() {
                 $.mobile.loading('show');
                var idPais = $('#pais_origen').val();
                var query = new Kinvey.Query();
                query.ascending('ciudad');
                query.equalTo('id_pais', idPais);
                $("#ciudad_origen").empty();
                $("#ciudad_origen").append(new Option("Ciudad Origen", ''));
                $("#ciudad_origen").selectmenu('refresh');              
                $("#ciudad_origen").prop('selectedIndex', 0);
                var promiseCiudad = Kinvey.DataStore.find('ciudades', query, {
                      success: function(ciudades) {
                         var list = $("#ciudad_origen");
                         $.each(ciudades, function(index, ciudad) {
                            list.append(new Option(ciudad.ciudad, ciudad.id_ciudad));
                         });
                         $.mobile.loading('hide');
                      }
                  });
              });
            
            $('#pais_destino').change(function() {
                $.mobile.loading('show');
                var idPais = this.value;
                var query = new Kinvey.Query();
                query.ascending('ciudad');
                query.equalTo('id_pais', idPais);
                $("#ciudad_destino").empty();
                $("#ciudad_destino").append(new Option("Ciudad Destino", ''));
                $("#ciudad_destino").selectmenu('refresh');              
                $("#ciudad_destino").prop('selectedIndex', 0);
                var promiseCiudad = Kinvey.DataStore.find('ciudades', query, {
                      success: function(ciudades) {
                         var list = $("#ciudad_destino");
                         $.each(ciudades, function(index, ciudad) {
                            list.append(new Option(ciudad.ciudad, ciudad.id_ciudad));
                         });
                         $.mobile.loading('hide');
                      }
                  });
            });
              
            $("#enviar").on("click", function() {
                ingresarSolicitud();
                //limpiarFormulario();
            });
	//Fin Insert
	
});

    showAlert = function (message, title) {
        if (navigator.notification) {
            navigator.notification.alert(message, null, title, 'OK');
        } else {
            alert(title ? (title + ": " + message) : message);
        }
    };

	showConfirmLogout = function() {
			if(navigator.notification){
				navigator.notification.confirm(
				'Desea Salir de la Aplicacion?',     
				doLogout,      
				'Logout',            
				['Cancelar','Salir']
				);
			}
			else {
				console.log("Notificaciones no disponibles...Logging out");
				$.mobile.loading('show');
				var user = Kinvey.getActiveUser();
				Kinvey.User.logout({
					success: function() {
						$.mobile.changePage('#logon');
						$.mobile.loading('hide');
					},
					error: function(e) {
						$.mobile.changePage('#logon'); 
						$.mobile.loading('hide');
					}
				});
			}
	};

    doLogout = function (buttonIndex) {
		console.log("buttonIndex "+buttonIndex);
		if(buttonIndex == 2) {
			$.mobile.loading('show');
			console.log("Logging out");
			var user = Kinvey.getActiveUser();
			 Kinvey.User.logout({
				success: function() {
					$.mobile.changePage('#logon'); 
					$.mobile.loading('hide');
					navigator.app.exitApp();
				},
				error: function(e) {
					$.mobile.changePage('#logon'); 
					$.mobile.loading('hide');
				}
			});
		}
		else {
			return false;
		}
	};
	
	function formatNumber(num,prefix)
	{
		num = Math.round(parseFloat(num)*Math.pow(10,2))/Math.pow(10,2)
		prefix = prefix || '';
		num += '';
		var splitStr = num.split('.');
		var splitLeft = splitStr[0];
		var splitRight = splitStr.length > 1 ? '.' + splitStr[1] : ',00';
		splitRight = splitRight + '00';
		splitRight = splitRight.substr(0,3);
		var regx = /(\d+)(\d{3})/;
		while (regx.test(splitLeft)) {
			splitLeft = splitLeft.replace(regx, '$1' + '.' + '$2');
		}
		return prefix + splitLeft + splitRight;
	}

	var datosSolicitud = {};
	
	var nombreUsuario = null;
	var solicitud = null;
	var motivo = null;
	var actividad = null;
	var claseViaje = null;
	var paisO = null;
	var ciudadO = null;
	var paisD = null;
	var ciudadD = null;


	function cargarPopUp(idSolicitud){
		solicitud = idSolicitud;
		$.mobile.changePage("#popup", {
			transition: "pop",
			reverse: false,
			changeHash: false
		});
	}

	function validarUsuario(){    
		$.mobile.loading('show');
		limpiarMensaje($('#mensaje'));
		
		var usuario = $('#usuario').val();
		var password = $('#password').val();
		
		if(usuario != null && password != null && usuario != '' && password != ''){
			
			var query = new Kinvey.Query();
			query.equalTo('usuario', usuario);
			Kinvey.DataStore.find('usuarios', query, {
				success: function(response) {
				   
					if(password == response[0].contrasena){
						idUsuario = response[0].usuario;
						nombreUsuario = response[0].nombre_usuario;
						$.mobile.changePage("#solicitud", {
								transition: "pop",
								reverse: false,
								changeHash: false
						});
						
						$( "#resetButton" ).click();
					} else {
						$('#mensaje').show();
						$('#mensaje').addClass('warning');
						$('#mensaje').text( 'El nombre de usuario o la contrase\u00F1a introducidos no son correctos.' );
					}                
					$.mobile.loading('hide');
				},
				error: function(error){
					console.log(error);
					$('#mensaje').show();
					$('#mensaje').addClass('warning');
					$('#mensaje').text( 'El nombre de usuario o la contrase\u00F1a introducidos no son correctos.' );
					$.mobile.loading('hide');
				}
			});
		   
			
		} else {
			$('#mensaje').show();
			$('#mensaje').addClass('warning');
			$('#mensaje').text( 'Debe ingresar el nombre de usuario y la contrase\u00F1a.' );
			$.mobile.loading('hide');
		}  
		
	}

	function salir(){
		
		$('#usuario').val("");
		$('#password').val("");
		
	}

	function iniciarCampos(){
		
		$("#mensaje").hide();
		$("#mensajeVinculacion").hide();
		
		$("#segmento").attr('readonly', true);
		$("#subsegmento").attr('readonly', true);
		$("#tamanoComercial").attr('readonly', true);
		$("#llaveCRM").attr('readonly', true);
		$("#calificacionInterna").attr('readonly', true);
		$("#estado").attr('readonly', true);
	}

	function consultarSolicitud(){
		
		var user = Kinvey.getActiveUser();
		var query = new Kinvey.Query();
		query.equalTo('id_usuario', idUsuario);
		query.ascending('id_solicitud');
		var estado;
		//Query q = mKinveyClient.query();
		//q.addSort("id_solicitud", SortOrder.Asc);
		$('#listusuario').empty();
		$('#listusuario').append('<li data-role="listview" data-filter="true" data-divider-theme="b" data-inset="true" data-filter-placeholder="bienvenida">Bienvenido ' + nombreUsuario + '</li>');
		$.mobile.loading('show');
		var promiseSolicitudes = Kinvey.DataStore.find('Solicitudes', query, {
			   success: function(solicitudes) {
				  console.log("Consulta satisfactoria de Solicitudes");
				  $('#ListaSolicitudes').empty();
				  $('#ListaSolicitudes').append('<li data-role="listview" data-filter="true" data-divider-theme="b" data-inset="true" data-filter-placeholder="Solicitudes">Solicitudes</li>');
				  for (var i = 0; i < solicitudes.length; i++){
					  if ( solicitudes[i].Estado == 0){
						estado = "Pendiente";
					  }else if ( solicitudes[i].Estado == 1){
						estado = "Aprobado";  
					  }else{
						estado = "Rechazado";  
					  }
					  $('#ListaSolicitudes').append('<li data-theme="c"><a href="#" onclick="cargarPopUp('+solicitudes[i].id_solicitud+')" data-id="' 
					  +solicitudes[i].id_solicitud + '"><b class="highlight">N° Solicitud:</b>  ' + solicitudes[i].id_solicitud + '<br/><b class="highlight">Fecha:</b> '
					  + solicitudes[i].fecha_inicio + '<br/><b class="highlight">Estado:</b> ' + estado +'</a></li>');
					  $('#ListaSolicitudes').listview('refresh');
					  $.mobile.loading('hide');
				  }
			   },
			   error: function(e) {
				   console.log("No ");
				   $.mobile.loading('hide');
			   }
			});
		$.mobile.loading('hide');
	   
	}

	function consultarMotivo(id_motivo){
		var queryMotivo = new Kinvey.Query();
		queryMotivo.equalTo('id_motivo', id_motivo);
		var promiseMotivo = Kinvey.DataStore.find('motivos', queryMotivo, {
			success: function(motivos) {
			   console.log("Consulta satisfactoria de Motivos");
			   motivo = motivos[0].motivo;
			   $('#inmotivo').val(motivo);
			   $('#inmotivo').attr('readonly', true);
			}
		});
	}

	function consultarClaseViaje(id_claseviaje){
		var queryClaseViaje = new Kinvey.Query();
		queryClaseViaje.equalTo('id_claseviaje', id_claseviaje);
		var promiseClaseViaje = Kinvey.DataStore.find('claseViaje', queryClaseViaje, {
			success: function(clase_viajes) {
			   console.log("Consulta satisfactoria de Clases de Viaje");
			   claseViaje = clase_viajes[0].clase_viaje;
			   $('#inclase_viaje').val(claseViaje);
			   $('#inclase_viaje').attr('readonly', true);
			}
		});
	}

	function consultarActividad(id_actividad){
		var queryActividad = new Kinvey.Query();
		queryActividad.equalTo('id_actividad', id_actividad);
		var promiseActividades = Kinvey.DataStore.find('actividades', queryActividad, {
			success: function(actividades) {
			   console.log("Consulta satisfactoria de Actividades");
			   actividad = actividades[0].actividad;
			   $('#inactividad').val(actividad);
			   $('#inactividad').attr('readonly', true);
			}
		});
	}

	function consultarDetalle(){
		var user = Kinvey.getActiveUser();
		var query = new Kinvey.Query();
		query.equalTo('id_solicitud', solicitud);
		var estado;
		$('#listsolicitud').empty();
		$('#listsolicitud').append('<li data-role="list-divider" data-divider-theme="b" role="heading">Solicitud ' + solicitud + '</li>');
		$.mobile.loading('show');
		var promiseSolicitudes = Kinvey.DataStore.find('Solicitudes', query, {
			   success: function(solicitud1) {
				  console.log("Consulta satisfactoria de Solicitud");
					 
					  var id_motivo = solicitud1[0].id_motivo;
					  var id_claseviaje = solicitud1[0].id_claseviaje;
					  var id_actividad = solicitud1[0].id_actividad;
					  var pais_origen = solicitud1[0].pais_origen;
					  var pais_destino = solicitud1[0].pais_destino;
					  var ciudad_origen = solicitud1[0].ciudad_origen;
					  var ciudad_destino = solicitud1[0].ciudad_destino;
					  var id_moneda = solicitud1[0].moneda;
					  if(id_motivo != '' || id_motivo != null){
						  consultarMotivo(id_motivo);
					  }
					  if(id_claseviaje != '' || id_claseviaje != null ){
						 consultarClaseViaje(id_claseviaje);
					  }
					  if(id_actividad != '' || id_actividad != null){
						  consultarActividad(id_actividad);
					  }
					  
					  cargarPaisesO(pais_origen);
					  cargarPaisesD(pais_destino);
					  cargarCiudadesO(ciudad_origen);
					  cargarCiudadesD(ciudad_destino);
					  cargarMonedas(id_moneda);
					  var estado;
					  if ( solicitud1[0].Estado == 0){
						estado = "Pendiente";
					  }else if ( solicitud1[0].Estado == 1){
						estado = "Aprobado";  
					  }else{
						estado = "Rechazado";  
					  }
					  
					  $('#infecha_inicio').val(solicitud1[0].fecha_inicio);
					  $('#infecha_inicio').attr('readonly', true);
					  $('#infecha_final').val(solicitud1[0].fecha_fin);
					  $('#infecha_final').attr('readonly', true);
					  $('#inanticipo').val(solicitud1[0].Anticipo);
					  $('#inanticipo').attr('readonly', true);
					  $('#inestado').val(estado);
					  $('#inestado').attr('readonly', true);
					  $('#tadetalle_estado').val(solicitud1[0].DetalleAprobacion);
					  $('#tadetalle_estado').attr('readonly', true);
					  $.mobile.loading('hide');
			   },
			   error: function(e) {
				   console.log("No ");
				   $.mobile.loading('hide');
			   }
			});
		promiseSolicitudes.then(function(){
			$.mobile.loading('hide');
		});
		  
	}

	function cargarPaisesO(id_pais){
		
		var queryPaises = new Kinvey.Query();
		if(id_pais != ''){
			queryPaises.equalTo('id_pais', id_pais);
		}
		queryPaises.ascending('pais');
		var promisepaises = Kinvey.DataStore.find('paises', queryPaises, {
			success: function(paiseso) {
				if(id_pais != ''){
				   paisO = paiseso[0].pais;
				   $('#inpais_origen').val(paisO);
				   $('#inpais_origen').attr('readonly', true);
				}else{    
				   var list = $("#pais_origen");
				   $("#pais_origen").append(new Option("Pais Origen", ''));
				   $("#pais_origen").selectmenu('refresh');              
				   $("#pais_origen").prop('selectedIndex', 0);
				   $.each(paiseso, function(index, paiso) {
					  list.append(new Option(paiso.pais, paiso.id_pais));
				   });
				}
			}
		});
		
	}

	function cargarPaisesD(id_pais){
		
		var queryPaises = new Kinvey.Query();
		queryPaises.ascending('pais');
		if(id_pais != ''){
			queryPaises.equalTo('id_pais', id_pais);
		}
		var promisepaises = Kinvey.DataStore.find('paises', queryPaises, {
			success: function(paisesd) {
				if(id_pais != ''){
					paisD = paisesd[0].pais;
					$('#inpais_destino').val(paisD);
					$('#inpais_destino').attr('readonly', true);
				}else{
					var list = $("#pais_destino");
					$("#pais_destino").append(new Option("Pais Destino", ''));
					$("#pais_destino").selectmenu('refresh');              
					$("#pais_destino").prop('selectedIndex', 0);
					$.each(paisesd, function(index, paisd) {
					list.append(new Option(paisd.pais, paisd.id_pais));
					});
				}
			}
		});
		
	}

	function cargarCiudadesO(id_ciudad){
		var queryCiudadesO = new Kinvey.Query();
		queryCiudadesO.equalTo('id_ciudad', id_ciudad);
		var promiseCiudad = Kinvey.DataStore.find('ciudades', queryCiudadesO, {
			success: function(ciudado) {
			   console.log("Consulta satisfactoria de Ciudad Origen");
			   ciudadO = ciudado[0].ciudad;
			   $('#inciudad_origen').val(ciudadO);
			   $('#inciudad_origen').attr('readonly', true);
			}
		});
	}

	function cargarCiudadesD(id_ciudad){
		var queryCiudadesD = new Kinvey.Query();
		queryCiudadesD.equalTo('id_ciudad', id_ciudad);
		var promiseCiudad = Kinvey.DataStore.find('ciudades', queryCiudadesD, {
			success: function(ciudadd) {
			   console.log("Consulta satisfactoria de Ciudad Destino");
			   ciudadD = ciudadd[0].ciudad;
			   $('#inciudad_destino').val(ciudadD);
			   $('#inciudad_destino').attr('readonly', true);
			}
		});
	}

	function cargarMonedas(id_moneda){
		
		var queryMoneda = new Kinvey.Query();
		queryMoneda.ascending('moneda');
		if(id_moneda != ''){
			queryMoneda.equalTo('id_moneda', id_moneda);
		}
		var promisemoneda = Kinvey.DataStore.find('monedas', queryMoneda, {
			success: function(monedas) {
				if(id_moneda != ''){
					$('#inmoneda').val(monedas[0].moneda);
					  $('#inmoneda').attr('readonly', true);
				}else{
				   var list = $("#moneda");
				   $("#moneda").append(new Option("Moneda", ''));
				   $("#moneda").selectmenu('refresh');              
				   $("#moneda").prop('selectedIndex', 0);
				   $.each(monedas, function(index, moneda) {
					  list.append(new Option(moneda.moneda, moneda.id_moneda));
					});
				}
			}
		});
		
	}

	function cargarClaseViajes(){
		
		var queryClaseViajes = new Kinvey.Query();
		queryClaseViajes.ascending('clase_viaje');
		var promiseclaseviaje = Kinvey.DataStore.find('claseViaje', queryClaseViajes, {
			success: function(claseViajes) {
			   var list = $("#clase_viaje");
			   $("#clase_viaje").append(new Option("Clase de Viaje", ''));
			   $("#clase_viaje").selectmenu('refresh');              
			   $("#clase_viaje").prop('selectedIndex', 0);
			   $.each(claseViajes, function(index, claseViaje) {
				  list.append(new Option(claseViaje.clase_viaje, claseViaje.id_claseviaje));
			   });
			}
		});
		
	}

	function cargarActividades(){
		
		var queryActividad = new Kinvey.Query();
		queryActividad.ascending('actividad');
		var promiseactividad = Kinvey.DataStore.find('actividades', queryActividad, {
			success: function(actividades) {
			   var list = $("#actividad");
			   $("#actividad").append(new Option("Actividad", ''));
			   $("#actividad").selectmenu('refresh');              
			   $("#actividad").prop('selectedIndex', 0);
			   $.each(actividades, function(index, actividad) {
				  list.append(new Option(actividad.actividad, actividad.id_actividad));
			   });
			}
		});
		
	}

	function cargarMotivos(){
		
		var queryMotivos = new Kinvey.Query();
		queryMotivos.ascending('motivo');
		var promisemotivo = Kinvey.DataStore.find('motivos', queryMotivos, {
			success: function(motivos) {
			   var list = $("#cmbMotivo");
			   $("#cmbMotivo").append(new Option("Motivo", ''));
			   $("#cmbMotivo").selectmenu('refresh');              
			   $("#cmbMotivo").prop('selectedIndex', 0);
			   $.each(motivos, function(index, motivo) {
				  list.append(new Option(motivo.motivo, motivo.id_motivo));
			   });
			}
		});
		
	}

	var error = '';

	function ingresarSolicitud(){
		error = '';
		datosSolicitud.fecha_inicio = $('#fecha_inicio').val();
		datosSolicitud.fecha_fin = $('#fecha_fin').val();
		datosSolicitud.pais_origen = $('#pais_origen').val();
		datosSolicitud.ciudad_origen = $('#ciudad_origen').val();
		datosSolicitud.pais_destino = $('#pais_destino').val();
		datosSolicitud.ciudad_destino = $('#ciudad_destino').val();
		datosSolicitud.Anticipo = $('#anticipo').val();
		datosSolicitud.moneda = parseInt($('#moneda').val());
		datosSolicitud.id_claseviaje = parseInt($('#clase_viaje').val());
		datosSolicitud.Estado = '0';
		datosSolicitud.id_usuario = idUsuario;
		datosSolicitud.id_actividad = parseInt($('#actividad').val());
		datosSolicitud.id_motivo = parseInt($('#cmbMotivo').val());
		datosSolicitud.comentarios = $('#comentarios').val();
		if (datosSolicitud.fecha_inicio == '' || datosSolicitud.fecha_fin == '' || 
			datosSolicitud.pais_origen == '' || datosSolicitud.ciudad_origen == '' ||
			datosSolicitud.pais_destino == '' ||datosSolicitud.ciudad_destino == '' || 
			datosSolicitud.anticipo == '' || datosSolicitud.moneda == '' ||
			$('#motivo').val() == '' || $('#clase_viaje').val() == '' ||
			$('#actividad').val() == ''){
			error = 'Se deben diligenciar todos los campos';
		}
		if(isNaN(datosSolicitud.Anticipo)){
			error = 'No se permiten caracteres en el campo moneda';
		}
		if( new Date(datosSolicitud.fecha_inicio) > new Date(datosSolicitud.fecha_fin) ){
			error = 'La fecha de inicio no puede ser mayor a la fecha final';
		}
		if (error != ''){
            console.log(error);
            /*$('#mensaje1').show();
            $('#mensaje1').addClass('warning');
            $('#mensaje1').text(error);*/
            showAlert(error,"Error");
        } else {
        		var queryConsec = new Kinvey.Query();
        		queryConsec.descending('id_solicitud');
        		queryConsec.limit(1);
        		var promisemotivo = Kinvey.DataStore.find('Solicitudes', queryConsec, {
        			success: function(consecutivo) {
        				var solicitudId = consecutivo[0].id_solicitud + 1;
        				datosSolicitud.id_solicitud = solicitudId; 
        				
        			}
        		});
        		
        		promisemotivo.then( function() {
        			$.mobile.loading('show');
        			Kinvey.DataStore.save('Solicitudes', datosSolicitud, {
        				success: function(response) {
        					console.log("Solicitud Creada con Éxito");
        					$.mobile.changePage("#mensaje", {
        							transition: "pop",
        							reverse: false,
        							changeHash: false
        					});
        					$('#mensajesys').val("La solicitud ha sido creada con Éxito con el número " + datosSolicitud.id_solicitud);
        					$('#mensajesys').attr('readonly', true);
        					limpiarFormulario();
        				},
        				error: function(error){
        					console.log(error);
        					$.mobile.loading('hide');
        				}
        			});
        			$.mobile.loading('hide');
        		});
        }
	}

	function limpiarFormulario(){
		$('#fecha_inicio').val("");
		$('#fecha_fin').val("");
		$('#pais_origen').val("");
		$('#pais_origen').text("Pais Origen");
		$('#ciudad_origen').val("");
		$('#ciudad_origen').text("Ciudad Origen");
		$('#pais_destino').val("");
		$('#pais_destino').text("Pais Destino");
		$('#ciudad_destino').val("");
		$('#ciudad_destino').text("Ciudad Destino");
		$('#anticipo').val("");
		$('#moneda').val("");
		$('#moneda').text("Moneda");
		$('#clase_viaje').val("");
		$('#clase_viaje').text("Clase de Viaje");
		$('#actividad').val("");
		$('#actividad').text("Actividad");
		$('#cmbMotivo').val("");
		$('#cmbMotivo').text("Motivo");
		$('#comentarios').val("");
	}

	function limpiarMensaje(objeto){
		objeto.removeClass("error");
		objeto.removeClass("success");
		objeto.removeClass("warning");
		objeto.removeClass("info");
		objeto.text( ' ' );
		objeto.hide();
	}

	function agregarMensaje(objeto, tipoError, mensaje){
		objeto.removeClass("error");
		objeto.removeClass("success");
		objeto.removeClass("warning");
		objeto.removeClass("info");
		
		if(tipoError == 'W'){
			objeto.addClass('warning');
		} else if(tipoError == 'S'){
			objeto.addClass('success');
		} if(tipoError == 'I'){
			objeto.addClass('info');
		} if(tipoError == 'E'){
			objeto.addClass('error');
		}
		objeto.text( mensaje );
		objeto.show();
		
	}

	function limpiarMensaje1(objeto){
		objeto.removeClass("error");
		objeto.removeClass("success");
		objeto.removeClass("warning");
		objeto.removeClass("info");
		objeto.text( ' ' );
		objeto.hide();
	}

	function agregarMensaje1(objeto, tipoError, mensaje1){
		objeto.removeClass("error");
		objeto.removeClass("success");
		objeto.removeClass("warning");
		objeto.removeClass("info");
		
		if(tipoError == 'W'){
			objeto.addClass('warning');
		} else if(tipoError == 'S'){
			objeto.addClass('success');
		} if(tipoError == 'I'){
			objeto.addClass('info');
		} if(tipoError == 'E'){
			objeto.addClass('error');
		}
		objeto.text( mensaje1 );
		objeto.show();
		
	}

	function limpiarDetalle(){
		$('#infecha_inicio').val('');
		$('#infecha_final').val('');
		$('#inanticipo').val('');
		$('#inestado').val('');
		$('#inpais_origen').val('');
		$('#inpais_destino').val('');
		$('#inciudad_origen').val('');
		$('#inciudad_destino').val('');
		$('#inactividad').val('');
		$('#inclase_viaje').val('');
		$('#inmotivo').val('');
		$('#inmoneda').val('');
		$('#inestado').val('');
		$('#tadetalle_estado').val('');
	}

	function readDataUrl(file) {
		window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onFileSystemSuccess, fail);
	}

	function onFileSystemSuccess(fileSystem) {
		console.log(fileSystem.name);
		console.log(fileSystem.root.name);
	}

	function fail(evt) {
		console.log(evt.target.error.code);
	}