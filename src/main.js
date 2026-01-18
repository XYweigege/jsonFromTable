import { createApp } from "vue";
import App from "./App.vue";

// 引入 Vant 4 样式
import "vant/lib/index.css";

// 引入 Vant 组件
import {
  Button,
  Cell,
  CellGroup,
  Field,
  Form,
  Picker,
  Popup,
  Toast,
  Dialog,
  Empty,
  Icon,
} from "vant";

// 引入自定义指令
import DirectivePlugin from "./utils/directive";

const app = createApp(App);

// 注册 Vant 组件
app.use(Button);
app.use(Cell);
app.use(CellGroup);
app.use(Field);
app.use(Form);
app.use(Picker);
app.use(Popup);
app.use(Toast);
app.use(Dialog);
app.use(Empty);
app.use(Icon);

// 注册自定义指令
app.use(DirectivePlugin);

app.mount("#app");
