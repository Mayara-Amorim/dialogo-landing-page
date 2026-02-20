/* ==================================================================
   1. LÓGICA DE UI E NEGÓCIO
================================================================== */
$(document).ready(function () {
  // Lógica de UI: Navegação e Scroll Reveal
  $('a[href^="#"]').on("click", function (event) {
    const targetId = this.getAttribute("href");
    if (targetId === "#") return;
    const navbarToggler = $(".navbar-toggler");
    const navbarCollapse = $(".navbar-collapse");
    if (navbarCollapse.hasClass("show")) {
      navbarToggler.click();
    }
    const targetElement = $(targetId);
    if (targetElement.length) {
      event.preventDefault();
      $("html, body")
        .stop()
        .animate({ scrollTop: targetElement.offset().top - 80 }, 600, "swing");
    }
  });

  function validateScrollReveal() {
    const windowHeight = $(window).height();
    const scrollPos = $(window).scrollTop();
    $(".reveal-on-scroll").each(function () {
      const elementTop = $(this).offset().top;
      if (elementTop < scrollPos + windowHeight * 0.85) {
        $(this).addClass("is-revealed");
      }
    });
  }

  $("#btnRetry").on("click", function () {
    $("#errorMessage").fadeOut(300, function () {
      $(this).addClass("d-none");
      $("#contactModalLabel").removeClass("d-none");
      $("#contactForm").hide().slideDown(300);
    });
  });

  $("#contactModal").on("hidden.bs.modal", function () {
    $("#contactForm").trigger("reset").show();
    $('#contactForm button[type="submit"]')
      .text("Solicitar Análise Sem Compromisso")
      .prop("disabled", false);
    $("#contactModalLabel").removeClass("d-none");
    $("#successMessage").addClass("d-none");
    $("#errorMessage").addClass("d-none");
  });

  $("#mensagem").on("input", function () {
    this.style.height = "auto";
    this.style.height = this.scrollHeight + "px";
  });

  $(window).on("scroll", validateScrollReveal);
  validateScrollReveal();
});

/* ==================================================================
   2. ORQUESTRAÇÃO DE E-MAIL (API Google Cloud)
================================================================== */
function onSubmit(token) {
  const btn = $('#contactForm button[type="submit"]');
  btn.text("Processando...").prop("disabled", true);
  const data = {
    name: $("#nome").val(),
    email: $("#email").val(),
    moment: $("#momento").val(),
    budget: $("#orcamento").val(),
    message: $("#mensagem").val(),
    token: token,
  };

  $.ajax({
    url: "https://dialogo-contact-api-mgews7ql2q-rj.a.run.app",
    type: "POST",
    contentType: "application/json",
    data: JSON.stringify(data),
    success: function (res) {
      $("#contactForm").slideUp(300, function () {
        $("#successMessage").removeClass("d-none").hide().fadeIn(400);
        $("#contactModalLabel").addClass("d-none");
      });
    },
    error: function (xhr) {
      $("#contactForm").slideUp(300, function () {
        $("#errorMessage").removeClass("d-none").hide().fadeIn(400);
        $("#contactModalLabel").addClass("d-none");
      });
      btn.text("Solicitar Análise Sem Compromisso").prop("disabled", false);
      if (typeof grecaptcha !== "undefined") {
        grecaptcha.reset();
      }
    },
  });
}

/* ==================================================================
   INJEÇÃO DINÂMICA DO WEBGL
================================================================== */
// Só carrega o fundo 3D quando a página inteira (textos, css, fontes) já terminou de carregar
$(window).on("load", function () {
  // Atraso de 500ms para garantir que a CPU do celular ficou 100% livre
  setTimeout(function () {
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
    script.onload = initWebGLBackground; // Quando terminar de baixar, roda a função abaixo
    document.body.appendChild(script);
  }, 500);
});

function initWebGLBackground() {
  const canvas = document.getElementById("bg-canvas");
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: false,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const uniforms = {
    uTime: { value: 0.0 },
    uScroll: { value: 0.0 },
    uResolution: {
      value: new THREE.Vector2(window.innerWidth, window.innerHeight),
    },
  };

  const vertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform float uTime;
    uniform float uScroll;
    uniform vec2 uResolution;
    varying vec2 vUv;

    vec3 mod289(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

    float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy));
        vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m; m = m*m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
        vec3 g;
        g.x = a0.x * x0.x + h.x * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
    }

    float fbm(vec2 p) {
        float value = 0.0;
        float amplitude = 0.5;
        float frequency = 1.0;
        for (int i = 0; i < 5; i++) {
            value += amplitude * snoise(p * frequency);
            amplitude *= 0.5;
            frequency *= 2.0;
        }
        return value;
    }

    void main() {
        vec2 uv = vUv;
        float aspect = uResolution.x / uResolution.y;
        vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
        
        float scrollOffset = uScroll * 0.5;
        float time = uTime * 0.06; 
        
        float n1 = fbm(p * 1.5 + vec2(time * 0.3, scrollOffset * 0.5));
        float n2 = fbm(p * 2.5 + vec2(-time * 0.2, scrollOffset * 0.8 + 3.0));
        float n3 = fbm(p * 0.8 + vec2(time * 0.1 + n1 * 0.3, -scrollOffset * 0.3));
        
        float combined = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;
        
        vec3 baseColor = vec3(0.059, 0.059, 0.059); 
        vec3 midColor = vec3(0.102, 0.102, 0.102); 
        vec3 wineColor = vec3(0.227, 0.039, 0.039); 
        
        float burgundyInfluence = smoothstep(-0.2, 0.6, combined) * (0.2 + uScroll * 0.15);
        vec3 color = mix(baseColor, midColor, smoothstep(-0.5, 0.5, n1));
        color = mix(color, wineColor, burgundyInfluence);
        
        float nodes = 0.0;
        for (float i = 0.0; i < 5.0; i++) {
            vec2 nodePos = vec2(
                sin(time * (0.3 + i * 0.1) + i * 1.7) * 0.4,
                cos(time * (0.2 + i * 0.15) + i * 2.3 + scrollOffset * 0.2) * 0.35
            );
            float dist = length(p - nodePos);
            nodes += 0.002 / (dist * dist + 0.01);
        }
        color += wineColor * nodes * 0.1;
        
        float vig = 1.0 - length((uv - 0.5) * 1.4);
        vig = smoothstep(0.0, 0.7, vig);
        color *= vig * 0.95 + 0.05;
        
        gl_FragColor = vec4(color, 1.0);
    }
  `;

  const geometry = new THREE.PlaneGeometry(2, 2);
  const material = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    uniforms: uniforms,
  });

  scene.add(new THREE.Mesh(geometry, material));

  let targetScroll = 0;
  $(window).on("scroll", function () {
    const maxScroll = document.body.scrollHeight - window.innerHeight;
    if (maxScroll > 0) {
      targetScroll = window.scrollY / maxScroll;
    }
  });

  $(window).on("resize", function () {
    renderer.setSize(window.innerWidth, window.innerHeight);
    uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
  });

  const clock = new THREE.Clock();
  let isCanvasVisible = true;
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        isCanvasVisible = entries[0].isIntersecting;
      },
      { threshold: 0 },
    );
    observer.observe(canvas);
  }

  function animate() {
    requestAnimationFrame(animate);
    if (!isCanvasVisible) return;

    uniforms.uTime.value = clock.getElapsedTime();
    uniforms.uScroll.value += (targetScroll - uniforms.uScroll.value) * 0.05;
    renderer.render(scene, camera);
  }
  animate();
}

/* Lógica de UI: Navegação e Scroll Reveal */
$('a[href^="#"]').on("click", function (event) {
  const targetId = this.getAttribute("href");
  if (targetId === "#") return;

  // Fecha menu mobile ao clicar no link
  const navbarToggler = $(".navbar-toggler");
  const navbarCollapse = $(".navbar-collapse");
  if (navbarCollapse.hasClass("show")) {
    navbarToggler.click();
  }

  const targetElement = $(targetId);
  if (targetElement.length) {
    event.preventDefault();
    $("html, body")
      .stop()
      .animate(
        {
          scrollTop: targetElement.offset().top - 80,
        },
        600,
        "swing",
      );
  }
});

function validateScrollReveal() {
  const windowHeight = $(window).height();
  const scrollPos = $(window).scrollTop();
  $(".reveal-on-scroll").each(function () {
    const elementTop = $(this).offset().top;
    if (elementTop < scrollPos + windowHeight * 0.85) {
      $(this).addClass("is-revealed");
    }
  });
}
$("#btnRetry").on("click", function () {
  $("#errorMessage").fadeOut(300, function () {
    $(this).addClass("d-none");
    $("#contactModalLabel").removeClass("d-none");
    $("#contactForm").hide().slideDown(300);
  });
});

$("#contactModal").on("hidden.bs.modal", function () {
  $("#contactForm").trigger("reset").show();
  $('#contactForm button[type="submit"]')
    .text("Enviar Mensagem")
    .prop("disabled", false);
  $("#contactModalLabel").removeClass("d-none");
  $("#successMessage").addClass("d-none");
  $("#errorMessage").addClass("d-none");
});

/* ==================================================================
       AUTO-RESIZE DO TEXTAREA
    ================================================================== */
$("#mensagem").on("input", function () {
  // Reseta a altura momentaneamente para permitir que o campo encolha caso o usuário apague o texto
  this.style.height = "auto";

  // Define a nova altura baseada no tamanho real do conteúdo rolado (scrollHeight)
  this.style.height = this.scrollHeight + "px";
});
$(window).on("scroll", validateScrollReveal);
validateScrollReveal();

/* ==================================================================
   LÓGICA DO MODAL DE CONTATO E ENVIO DE E-MAIL
================================================================== */
function onSubmit(token) {
  const form = document.getElementById("contactForm");

  // Força o HTML5 a checar os campos "required"
  if (!form.checkValidity()) {
    form.reportValidity();
    if (typeof grecaptcha !== "undefined") {
      grecaptcha.reset();
    }
    return;
  }
  const btn = $('#contactForm button[type="submit"]');
  btn.text("Processando...").prop("disabled", true);

  const data = {
    name: $("#nome").val(),
    email: $("#email").val(),
    moment: $("#momento").val(),
    budget: $("#orcamento").val(),
    message: $("#mensagem").val(),
    token: token,
  };

  $.ajax({
    url: "https://dialogo-contact-api-mgews7ql2q-rj.a.run.app",
    type: "POST",
    contentType: "application/json",
    data: JSON.stringify(data),
    success: function (res) {
      $("#contactForm").slideUp(300, function () {
        $("#successMessage").removeClass("d-none").hide().fadeIn(400);
        $("#contactModalLabel").addClass("d-none");
      });
    },
    error: function (xhr) {
      $("#contactForm").slideUp(300, function () {
        $("#errorMessage").removeClass("d-none").hide().fadeIn(400);
        $("#contactModalLabel").addClass("d-none");
      });
      btn.text("Solicitar Análise Sem Compromisso").prop("disabled", false);
      if (typeof grecaptcha !== "undefined") {
        grecaptcha.reset();
      }
    },
  });
}
