(() => {
  if(window.EXERCISE_CATALOG) return;

  const BAND_OPTIONS=["30-50lb","50-70lb"];
  const SCENES={
    gym_machine:{label:"健身房固定器械",short:"固定器械",order:10},
    gym_free:{label:"健身房自由器械",short:"自由器械",order:20},
    gym_cable:{label:"龙门架 / 钢线",short:"钢线",order:30},
    street:{label:"街头健身",short:"街健",order:40},
    home:{label:"居家 / 自重",short:"居家",order:50},
    band:{label:"弹力带",short:"弹力带",order:60},
    kettlebell:{label:"壶铃 / 功能训练",short:"壶铃",order:70},
    suspension:{label:"TRX / 悬吊",short:"TRX",order:80},
    medicine:{label:"药球 / 爆发力",short:"药球",order:90},
    other:{label:"其他",short:"其他",order:99}
  };

  const R=[];
  const add=(id,name,group,scenes,equipment,movement,illustration,loadType="weight",aliases=[],targets=[],extra={})=>{
    R.push({id,name,group,scenes:Array.isArray(scenes)?scenes:[scenes],equipment,movement,illustration,loadType,aliases,targets,...extra});
  };

  // 胸 / 推
  add("bench","杠铃卧推","胸",["gym_free"],"杠铃 + 卧推凳","水平推","press");
  add("incline_barbell_press","上斜杠铃卧推","胸",["gym_free"],"杠铃 + 上斜凳","上斜推","press", "weight",["上斜卧推"],["上胸"]);
  add("decline_barbell_press","下斜杠铃卧推","胸",["gym_free"],"杠铃 + 下斜凳","下斜推","press");
  add("close_grip_bench","窄握卧推","三头/胸",["gym_free"],"杠铃 + 卧推凳","水平推","press");
  add("floor_press_barbell","杠铃地板卧推","胸/三头",["gym_free","home"],"杠铃","水平推","press");
  add("db_bench","哑铃卧推","胸",["gym_free","home"],"哑铃 + 卧推凳","水平推","press");
  add("incline_db_press","哑铃上斜卧推","胸",["gym_free","home"],"哑铃 + 上斜凳","上斜推","press");
  add("decline_db_press","哑铃下斜卧推","胸",["gym_free"],"哑铃 + 下斜凳","下斜推","press");
  add("neutral_db_press","对握哑铃卧推","胸/三头",["gym_free","home"],"哑铃 + 卧推凳","水平推","press");
  add("db_floor_press","哑铃地板卧推","胸/三头",["gym_free","home"],"哑铃","水平推","press");
  add("db_fly","哑铃飞鸟","胸",["gym_free","home"],"哑铃 + 卧推凳","水平夹胸","fly");
  add("incline_db_fly","上斜哑铃飞鸟","胸",["gym_free","home"],"哑铃 + 上斜凳","上斜夹胸","fly");
  add("db_pullover","哑铃上拉","胸/背",["gym_free","home"],"哑铃 + 卧推凳","肩伸展","pullover");
  add("chest_press","器械推胸","胸",["gym_machine"],"推胸机","水平推","machine_press");
  add("incline_chest_press_machine","器械上斜推胸","胸",["gym_machine"],"上斜推胸机","上斜推","machine_press");
  add("decline_chest_press_machine","器械下斜推胸","胸",["gym_machine"],"下斜推胸机","下斜推","machine_press");
  add("converging_chest_press","收敛式推胸","胸",["gym_machine"],"收敛式推胸机","水平推","machine_press");
  add("iso_lateral_chest_press","独立臂推胸","胸",["gym_machine"],"独立臂推胸机","水平推","machine_press");
  add("pecdeck","蝴蝶机夹胸","胸",["gym_machine"],"蝴蝶机","水平夹胸","fly");
  add("machine_pullover","器械上拉","背/胸",["gym_machine"],"上拉机","肩伸展","pullover");
  add("cable_fly","龙门架夹胸","胸",["gym_cable"],"龙门架","水平夹胸","fly");
  add("cable_fly_high_to_low","高位钢线夹胸","胸",["gym_cable"],"龙门架","高到低夹胸","fly");
  add("cable_fly_low_to_high","低位钢线夹胸","胸",["gym_cable"],"龙门架","低到高夹胸","fly");
  add("single_arm_cable_press","单臂钢线推胸","胸",["gym_cable"],"龙门架","单臂水平推","press");
  add("pushup","俯卧撑","胸/三头",["street","home"],"自重","水平推","pushup","bodyweight_extra",["标准俯卧撑"],["胸","三头"],{bodyweightFactor:.65});
  add("wide_pushup","宽距俯卧撑","胸",["street","home"],"自重","水平推","pushup","bodyweight");
  add("diamond_pushup","钻石俯卧撑","三头/胸",["street","home"],"自重","水平推","pushup","bodyweight");
  add("decline_pushup","下斜俯卧撑","胸",["street","home"],"自重","上斜推","pushup","bodyweight");
  add("incline_pushup","上斜俯卧撑","胸",["street","home"],"自重 / 箱凳","水平推","pushup","bodyweight");
  add("archer_pushup","弓箭手俯卧撑","胸/三头",["street","home"],"自重","单侧水平推","pushup","bodyweight");
  add("pseudo_planche_pushup","伪俄挺俯卧撑","胸/肩/三头",["street","home"],"自重","水平推","pushup","bodyweight");

  // 背 / 拉
  add("pullup","引体向上","背/二头",["street","gym_free","home"],"单杠","垂直拉","pullup","bodyweight_extra",["正握引体"],["背","二头"],{bodyweightFactor:1});
  add("chinup","反手引体向上","背/二头",["street","gym_free","home"],"单杠","垂直拉","pullup","bodyweight_extra",[],["背","二头"],{bodyweightFactor:1});
  add("neutral_pullup","对握引体向上","背/二头",["street","gym_free"],"对握引体架","垂直拉","pullup","bodyweight_extra",[],["背","二头"],{bodyweightFactor:1});
  add("wide_pullup","宽握引体向上","背",["street","gym_free"],"单杠","垂直拉","pullup","bodyweight_extra",[],["背"],{bodyweightFactor:1});
  add("scapular_pullup","肩胛引体","背/肩胛",["street","home"],"单杠","肩胛下沉","pullup","bodyweight");
  add("australian_row","澳式引体 / 反向划船","背/二头",["street","home"],"低杠 / 吊环","水平拉","row","bodyweight");
  add("ring_row","吊环划船","背/二头",["street","home"],"吊环","水平拉","row","bodyweight");
  add("barbell_row","杠铃划船","背",["gym_free","home"],"杠铃","水平拉","row");
  add("pendlay_row","潘德雷划船","背",["gym_free"],"杠铃","水平拉","row");
  add("underhand_barbell_row","反握杠铃划船","背/二头",["gym_free"],"杠铃","水平拉","row");
  add("landmine_row","地雷管划船","背",["gym_free"],"地雷管 + 杠铃","水平拉","row");
  add("tbar_row","T 杆划船","背",["gym_free","gym_machine"],"T 杆 / T 杆机","水平拉","row");
  add("db_row","单臂哑铃划船","背",["gym_free","home"],"哑铃 + 凳","水平拉","row");
  add("chest_supported_db_row","胸托哑铃划船","背",["gym_free"],"哑铃 + 上斜凳","水平拉","row");
  add("seal_row","封印划船","背",["gym_free"],"杠铃 + 高凳","水平拉","row");
  add("meadows_row","梅多斯划船","背",["gym_free"],"地雷管 + 杠铃","水平拉","row");
  add("pulldown","高位下拉","背",["gym_cable","gym_machine"],"高位下拉机","垂直拉","pulldown");
  add("neutral_pulldown","对握下拉","背",["gym_cable","gym_machine"],"高位下拉机 + 对握把","垂直拉","pulldown");
  add("underhand_pulldown","反握高位下拉","背/二头",["gym_cable"],"高位下拉机","垂直拉","pulldown");
  add("wide_pulldown","宽握高位下拉","背",["gym_cable"],"高位下拉机","垂直拉","pulldown");
  add("cable_single_pulldown","单手钢线下拉","背",["gym_cable"],"龙门架","单臂垂直拉","pulldown");
  add("kneeling_single_pulldown","跪姿单臂下拉","背",["gym_cable"],"龙门架","单臂垂直拉","pulldown");
  add("row","坐姿划船","背",["gym_cable","gym_machine"],"坐姿划船机","水平拉","row");
  add("cable_row_neutral","对握坐姿划船","背",["gym_cable"],"低位划船机 + 对握把","水平拉","row");
  add("cable_row_wide","宽握坐姿划船","背/后束",["gym_cable"],"低位划船机 + 宽把","水平拉","row");
  add("single_arm_cable_row","单臂钢线划船","背",["gym_cable"],"龙门架","单臂水平拉","row");
  add("machine_single_row","单手器械划船","背",["gym_machine"],"独立臂划船机","水平拉","machine_row");
  add("singlepull","器械单臂下拉","背",["gym_machine"],"独立臂下拉机","垂直拉","pulldown");
  add("machine_row","器械坐姿划船","背",["gym_machine"],"划船机","水平拉","machine_row");
  add("high_row_machine","高位划船机","背",["gym_machine"],"高位划船机","斜向拉","machine_row");
  add("low_row_machine","低位划船机","背",["gym_machine"],"低位划船机","水平拉","machine_row");
  add("chest_supported_row","胸托划船","背",["gym_machine","gym_free"],"胸托划船机 / 胸托凳","水平拉","machine_row");
  add("seated_row_high_elbow","坐姿划船（平肘）","背/后束",["gym_cable","gym_machine"],"划船机","水平拉","row");
  add("straight_arm_pulldown","直臂下压","背",["gym_cable"],"龙门架 + 直杆 / 绳","肩伸展","pullover");
  add("cable_pullover","钢线上拉","背",["gym_cable"],"龙门架","肩伸展","pullover");
  add("machine_back_extension","器械挺身","臀/腘绳肌/背",["gym_machine"],"背伸机","髋伸","hinge");

  // 肩
  add("ohp","杠铃肩推","肩",["gym_free"],"杠铃","垂直推","shoulder_press");
  add("seated_barbell_press","坐姿杠铃肩推","肩",["gym_free"],"杠铃 + 靠背凳","垂直推","shoulder_press");
  add("behind_neck_press","颈后推举","肩",["gym_free"],"杠铃","垂直推","shoulder_press");
  add("db_shoulder_press","哑铃推肩","肩",["gym_free","home"],"哑铃","垂直推","shoulder_press");
  add("arnold_press","阿诺德推举","肩",["gym_free","home"],"哑铃","垂直推","shoulder_press");
  add("single_arm_db_press","单臂哑铃肩推","肩/核心",["gym_free","home"],"哑铃","单臂垂直推","shoulder_press");
  add("landmine_press","地雷管推举","肩/胸",["gym_free"],"地雷管 + 杠铃","斜向推","shoulder_press");
  add("shoulderpress","器械推肩","肩",["gym_machine"],"推肩机","垂直推","machine_press");
  add("iso_shoulder_press","独立臂器械推肩","肩",["gym_machine"],"独立臂推肩机","垂直推","machine_press");
  add("lateral","哑铃侧平举","肩",["gym_free","home"],"哑铃","肩外展","raise");
  add("leaning_lateral_raise","倾斜哑铃侧平举","肩",["gym_free"],"哑铃","肩外展","raise");
  add("front_raise","哑铃前平举","肩",["gym_free","home"],"哑铃","肩屈曲","raise");
  add("y_raise","Y 字侧平举","肩",["gym_free","home"],"哑铃 / 小杠片","肩外展","raise");
  add("cable_lateral_raise","钢线侧平举","肩",["gym_cable"],"龙门架","肩外展","raise");
  add("behind_back_cable_lateral","背后钢线侧平举","肩",["gym_cable"],"龙门架","肩外展","raise");
  add("cable_front_raise","钢线前平举","肩",["gym_cable"],"龙门架","肩屈曲","raise");
  add("machine_lateral_raise","器械侧平举","肩",["gym_machine"],"侧平举机","肩外展","raise");
  add("reverse_fly","反向飞鸟","肩/后束",["gym_machine"],"反向蝴蝶机","水平外展","reverse_fly");
  add("db_reverse_fly","哑铃俯身反向飞鸟","肩/后束",["gym_free","home"],"哑铃","水平外展","reverse_fly");
  add("cable_reverse_fly","钢线反向飞鸟","肩/后束",["gym_cable"],"龙门架","水平外展","reverse_fly");
  add("face_pull","面拉","肩/后束",["gym_cable"],"龙门架 + 绳索","水平拉 / 外旋","face_pull");
  add("upright_row","直立划船","肩/斜方",["gym_free","gym_cable"],"杠铃 / EZ 杆 / 钢线","垂直拉","raise");
  add("db_shrug","哑铃耸肩","斜方",["gym_free","home"],"哑铃","肩胛上提","shrug");
  add("barbell_shrug","杠铃耸肩","斜方",["gym_free"],"杠铃","肩胛上提","shrug");
  add("machine_shrug","器械耸肩","斜方",["gym_machine"],"耸肩机","肩胛上提","shrug");

  // 二头
  add("curl","坐姿弯举","二头",["gym_free"],"哑铃 / 弯举椅","肘屈","curl");
  add("barbell_curl","杠铃弯举","二头",["gym_free"],"杠铃","肘屈","curl");
  add("ez_bar_curl","EZ 杆弯举","二头",["gym_free"],"EZ 杆","肘屈","curl");
  add("db_curl","哑铃弯举","二头",["gym_free","home"],"哑铃","肘屈","curl");
  add("alternating_db_curl","交替哑铃弯举","二头",["gym_free","home"],"哑铃","肘屈","curl");
  add("hammer_curl","锤式弯举","二头/肱肌",["gym_free","home"],"哑铃","肘屈","curl");
  add("cross_body_hammer_curl","跨体锤式弯举","二头/肱肌",["gym_free","home"],"哑铃","肘屈","curl");
  add("incline_curl","上斜哑铃弯举","二头",["gym_free"],"哑铃 + 上斜凳","肘屈","curl");
  add("preacher_curl","牧师凳弯举","二头",["gym_free","gym_machine"],"牧师凳 + EZ 杆 / 哑铃","肘屈","curl");
  add("spider_curl","蜘蛛弯举","二头",["gym_free"],"哑铃 / EZ 杆 + 上斜凳","肘屈","curl");
  add("cable_curl","钢线弯举","二头",["gym_cable"],"龙门架","肘屈","curl");
  add("rope_hammer_curl","绳索锤式弯举","二头/肱肌",["gym_cable"],"龙门架 + 绳","肘屈","curl");
  add("bayesian_curl","贝叶斯弯举","二头",["gym_cable"],"龙门架","肘屈","curl");
  add("machine_biceps_curl","器械二头弯举","二头",["gym_machine"],"二头弯举机","肘屈","curl");

  // 三头
  add("triceps","龙门架三头下压","三头",["gym_cable"],"龙门架","肘伸","triceps");
  add("rope_pushdown","绳索下压","三头",["gym_cable"],"龙门架 + 绳","肘伸","triceps");
  add("straight_bar_pushdown","直杆下压","三头",["gym_cable"],"龙门架 + 直杆","肘伸","triceps");
  add("reverse_grip_pushdown","反握下压","三头",["gym_cable"],"龙门架","肘伸","triceps");
  add("single_arm_pushdown","单臂三头下压","三头",["gym_cable"],"龙门架","肘伸","triceps");
  add("overhead_cable_extension","钢线过顶臂屈伸","三头",["gym_cable"],"龙门架 + 绳","肘伸","triceps");
  add("overhead_triceps_extension","哑铃过顶臂屈伸","三头",["gym_free","home"],"哑铃","肘伸","triceps");
  add("lying_triceps_extension","仰卧臂屈伸","三头",["gym_free"],"EZ 杆 / 杠铃 + 卧推凳","肘伸","triceps");
  add("db_skullcrusher","哑铃仰卧臂屈伸","三头",["gym_free","home"],"哑铃","肘伸","triceps");
  add("jm_press","JM Press","三头/胸",["gym_free"],"杠铃 + 卧推凳","肘伸 / 推","triceps");
  add("machine_triceps_extension","器械三头伸展","三头",["gym_machine"],"三头训练机","肘伸","triceps");
  add("assisted_dip_machine","辅助双杠臂屈伸","胸/三头",["gym_machine"],"辅助引体双杠机","垂直推","dip");
  add("dip","双杠臂屈伸","胸/三头",["street","gym_free"],"双杠","垂直推","dip","bodyweight_extra",[],["胸","三头"],{bodyweightFactor:1});
  add("straight_bar_dip","直杠臂屈伸","胸/三头",["street"],"单杠","垂直推","dip","bodyweight");
  add("bench_dip","凳上臂屈伸","三头",["home","gym_free"],"长凳 / 椅子","垂直推","dip","bodyweight");

  // 股四头 / 臀 / 腘绳肌
  add("squat","杠铃深蹲","股四头/臀",["gym_free"],"杠铃 + 深蹲架","深蹲","squat");
  add("high_bar_squat","高杠深蹲","股四头/臀",["gym_free"],"杠铃 + 深蹲架","深蹲","squat");
  add("low_bar_squat","低杠深蹲","臀/股四头",["gym_free"],"杠铃 + 深蹲架","深蹲","squat");
  add("front_squat","颈前深蹲","股四头/臀",["gym_free"],"杠铃 + 深蹲架","深蹲","squat");
  add("zercher_squat","泽奇深蹲","股四头/臀/核心",["gym_free"],"杠铃","深蹲","squat");
  add("box_squat","箱式深蹲","股四头/臀",["gym_free"],"杠铃 + 箱凳","深蹲","squat");
  add("goblet_squat","高脚杯深蹲","股四头/臀",["gym_free","home","kettlebell"],"哑铃 / 壶铃","深蹲","squat");
  add("landmine_squat","地雷管深蹲","股四头/臀",["gym_free"],"地雷管 + 杠铃","深蹲","squat");
  add("hack_squat","哈克深蹲","股四头",["gym_machine"],"哈克深蹲机","深蹲","leg_press");
  add("pendulum_squat","钟摆深蹲","股四头/臀",["gym_machine"],"钟摆深蹲机","深蹲","leg_press");
  add("v_squat","V Squat","股四头/臀",["gym_machine"],"V Squat 机","深蹲","leg_press");
  add("belt_squat","腰带深蹲","股四头/臀",["gym_machine"],"腰带深蹲机","深蹲","leg_press");
  add("legpress","45° 倒蹬","股四头/臀",["gym_machine"],"45° 倒蹬机","腿推","leg_press");
  add("horizontal_leg_press","水平腿举","股四头/臀",["gym_machine"],"水平腿举机","腿推","leg_press");
  add("single_leg_press","单腿倒蹬","股四头/臀",["gym_machine"],"腿举机","单腿腿推","leg_press");
  add("leg_extension","腿屈伸","股四头",["gym_machine"],"腿屈伸机","膝伸","leg_extension");
  add("single_leg_extension","单腿腿屈伸","股四头",["gym_machine"],"腿屈伸机","单腿膝伸","leg_extension");
  add("bulgarian_split_squat","保加利亚深蹲","股四头/臀",["gym_free","home"],"哑铃 / 杠铃 / 自重","单腿蹲","lunge");
  add("split_squat","分腿蹲","股四头/臀",["gym_free","home"],"哑铃 / 杠铃 / 自重","单腿蹲","lunge");
  add("walking_lunge","行走弓步","股四头/臀",["gym_free","home"],"哑铃 / 杠铃 / 自重","弓步","lunge");
  add("reverse_lunge","反向弓步","股四头/臀",["gym_free","home"],"哑铃 / 杠铃 / 自重","弓步","lunge");
  add("forward_lunge","前向弓步","股四头/臀",["gym_free","home"],"哑铃 / 杠铃 / 自重","弓步","lunge");
  add("curtsy_lunge","交叉弓步","臀/股四头",["gym_free","home"],"哑铃 / 自重","弓步","lunge");
  add("step_up","台阶上步","股四头/臀",["gym_free","home"],"箱凳 + 哑铃 / 自重","单腿蹲","lunge");
  add("pistol_squat","单腿手枪深蹲","股四头/臀",["street","home"],"自重","单腿蹲","squat","bodyweight");
  add("shrimp_squat","虾式深蹲","股四头/臀",["street","home"],"自重","单腿蹲","squat","bodyweight");
  add("bodyweight_squat","自重深蹲","股四头/臀",["home","street"],"自重","深蹲","squat","bodyweight");
  add("jump_squat","跳跃深蹲","股四头/臀",["home","street"],"自重","爆发深蹲","squat","bodyweight");
  add("wall_sit","靠墙静蹲","股四头",["home"],"墙","等长深蹲","squat","bodyweight");

  add("deadlift","传统硬拉","臀/腘绳肌/背",["gym_free"],"杠铃","髋铰链","hinge");
  add("sumo_deadlift","相扑硬拉","臀/大腿内侧",["gym_free"],"杠铃","髋铰链","hinge");
  add("trap_bar_deadlift","六角杠硬拉","臀/股四头/背",["gym_free"],"六角杠","髋铰链","hinge");
  add("rdl","罗马尼亚硬拉","腘绳肌/臀",["gym_free"],"杠铃","髋铰链","hinge");
  add("db_rdl","哑铃罗马尼亚硬拉","腘绳肌/臀",["gym_free","home"],"哑铃","髋铰链","hinge");
  add("single_leg_rdl","单腿罗马尼亚硬拉","腘绳肌/臀",["gym_free","home"],"哑铃 / 壶铃 / 自重","单腿髋铰链","hinge");
  add("good_morning","早安式","腘绳肌/臀/背",["gym_free"],"杠铃","髋铰链","hinge");
  add("cable_pull_through","钢线拉髋","臀/腘绳肌",["gym_cable"],"龙门架 + 绳","髋铰链","hinge");
  add("back_extension","山羊挺身","臀/腘绳肌",["gym_free","home"],"罗马椅","髋伸","hinge");
  add("reverse_hyper","反向挺身","臀/腘绳肌",["gym_machine"],"Reverse Hyper 机","髋伸","hinge");
  add("leg_curl","俯卧腿弯举","腘绳肌",["gym_machine"],"俯卧腿弯举机","膝屈","leg_curl");
  add("seated_leg_curl","坐姿腿弯举","腘绳肌",["gym_machine"],"坐姿腿弯举机","膝屈","leg_curl");
  add("standing_leg_curl","站姿单腿弯举","腘绳肌",["gym_machine"],"站姿腿弯举机","单腿膝屈","leg_curl");
  add("nordic_curl","北欧腿弯举","腘绳肌",["street","home","gym_free"],"固定脚踝 / 北欧凳","膝屈","leg_curl","bodyweight");
  add("sliding_leg_curl","滑垫腿弯举","腘绳肌",["home"],"滑垫 / 毛巾","膝屈","leg_curl","bodyweight");
  add("hip_thrust","杠铃臀推","臀",["gym_free"],"杠铃 + 长凳","髋伸","bridge");
  add("machine_hip_thrust","器械臀推","臀",["gym_machine"],"臀推机","髋伸","bridge");
  add("glute_bridge","臀桥","臀",["home","street"],"自重","髋伸","bridge","bodyweight");
  add("single_leg_glute_bridge","单腿臀桥","臀",["home","street"],"自重","单腿髋伸","bridge","bodyweight");
  add("cable_kickback","钢线后踢腿","臀",["gym_cable"],"龙门架 + 脚踝带","髋伸","kickback");
  add("machine_glute_kickback","器械后踢腿","臀",["gym_machine"],"臀部后踢机","髋伸","kickback");
  add("abductor","髋外展","臀",["gym_machine"],"髋外展机","髋外展","abduction");
  add("adductor","髋内收","大腿内侧",["gym_machine"],"髋内收机","髋内收","adduction");
  add("cable_hip_abduction","钢线髋外展","臀",["gym_cable"],"龙门架 + 脚踝带","髋外展","abduction");
  add("cable_hip_adduction","钢线髋内收","大腿内侧",["gym_cable"],"龙门架 + 脚踝带","髋内收","adduction");

  // 小腿 / 胫骨
  add("standing_calf_raise","站姿提踵","小腿",["gym_machine"],"站姿提踵机","跖屈","calf");
  add("seated_calf_raise","坐姿提踵","小腿",["gym_machine","gym_free"],"坐姿提踵机 / 杠铃","跖屈","calf");
  add("leg_press_calf_raise","腿举机提踵","小腿",["gym_machine"],"腿举机","跖屈","calf");
  add("smith_calf_raise","史密斯提踵","小腿",["gym_machine"],"史密斯机","跖屈","calf");
  add("single_leg_calf_raise","单腿提踵","小腿",["home","street","gym_free"],"自重 / 哑铃","跖屈","calf","bodyweight_extra");
  add("donkey_calf_raise","驴式提踵","小腿",["gym_machine","gym_free"],"驴式提踵机 / 负重","跖屈","calf");
  add("tibialis_raise","胫骨前肌抬脚","胫骨前肌",["home","gym_free"],"自重 / 胫骨训练器","背屈","calf","bodyweight");

  // 核心
  add("legraise","悬垂举腿","腹/核心",["street","gym_free"],"单杠","髋屈 / 骨盆后倾","core_hang","bodyweight");
  add("hanging_knee_raise","悬垂屈膝举腿","腹/核心",["street","gym_free"],"单杠","髋屈 / 骨盆后倾","core_hang","bodyweight");
  add("toes_to_bar","脚碰杠","腹/核心",["street","gym_free"],"单杠","髋屈 / 核心","core_hang","bodyweight");
  add("captains_chair_knee_raise","罗马椅屈膝举腿","腹/核心",["gym_machine"],"罗马椅","髋屈 / 核心","core_hang","bodyweight");
  add("cable_crunch","绳索卷腹","腹/核心",["gym_cable"],"龙门架 + 绳","脊柱屈曲","core_crunch");
  add("machine_crunch","器械卷腹","腹/核心",["gym_machine"],"卷腹机","脊柱屈曲","core_crunch");
  add("weighted_crunch","负重卷腹","腹/核心",["gym_free","home"],"杠片 / 哑铃","脊柱屈曲","core_crunch");
  add("crunch","卷腹","腹/核心",["home"],"自重","脊柱屈曲","core_crunch","bodyweight");
  add("reverse_crunch","反向卷腹","腹/核心",["home"],"自重","骨盆后倾","core_crunch","bodyweight");
  add("situp","仰卧起坐","腹/核心",["home"],"自重","脊柱屈曲","core_crunch","bodyweight");
  add("decline_situp","下斜仰卧起坐","腹/核心",["gym_free"],"下斜凳","脊柱屈曲","core_crunch","bodyweight");
  add("ab_wheel","健腹轮","腹/核心",["home","gym_free"],"健腹轮","抗伸展","core_rollout","bodyweight");
  add("barbell_rollout","杠铃滚轮","腹/核心",["gym_free"],"杠铃","抗伸展","core_rollout","bodyweight");
  add("plank","平板支撑","腹/核心",["home","street"],"自重","抗伸展","plank","bodyweight");
  add("side_plank","侧桥","腹/核心",["home","street"],"自重","抗侧屈","plank","bodyweight");
  add("hardstyle_plank","RKC 平板支撑","腹/核心",["home"],"自重","抗伸展","plank","bodyweight");
  add("dead_bug","死虫","腹/核心",["home"],"自重","抗伸展","core_floor","bodyweight");
  add("bird_dog","鸟狗式","腹/核心",["home"],"自重","抗旋转","core_floor","bodyweight");
  add("hollow_hold","Hollow Hold","腹/核心",["home","street"],"自重","抗伸展","core_floor","bodyweight");
  add("v_up","V 字卷腹","腹/核心",["home"],"自重","屈髋 / 卷腹","core_crunch","bodyweight");
  add("dragon_flag","龙旗","腹/核心",["street","home"],"长凳 / 固定物","抗伸展","core_floor","bodyweight");
  add("pallof_press","Pallof Press","腹/核心",["gym_cable","band"],"龙门架 / 弹力带","抗旋转","rotation");
  add("cable_woodchop","钢线伐木","腹/核心",["gym_cable"],"龙门架","旋转","rotation");
  add("cable_lift","钢线由下向上旋转","腹/核心",["gym_cable"],"龙门架","旋转","rotation");
  add("russian_twist","俄罗斯转体","腹/核心",["home","gym_free"],"自重 / 药球 / 哑铃","旋转","rotation","bodyweight");
  add("suitcase_carry","单侧提重行走","腹/核心",["gym_free","kettlebell"],"哑铃 / 壶铃","负重行走 / 抗侧屈","carry");
  add("farmers_walk","农夫行走","全身/核心",["gym_free","kettlebell"],"哑铃 / 壶铃 / 农夫把","负重行走","carry");

  // 街头健身技能
  add("muscle_up","双力臂","背/胸/三头",["street"],"单杠","爆发拉 + 越杠推","muscle_up","bodyweight");
  add("ring_muscle_up","吊环双力臂","背/胸/三头",["street"],"吊环","爆发拉 + 越环推","muscle_up","bodyweight");
  add("pike_pushup","Pike Push-up","肩/三头",["street","home"],"自重","垂直推","handstand","bodyweight");
  add("handstand_pushup","倒立俯卧撑","肩/三头",["street","home"],"墙 / 自重","垂直推","handstand","bodyweight");
  add("wall_handstand_hold","靠墙倒立支撑","肩/核心",["street","home"],"墙","等长支撑","handstand","bodyweight");
  add("l_sit","L-Sit","腹/核心/三头",["street","home"],"双杠 / 瑜伽砖","等长支撑","l_sit","bodyweight");
  add("tuck_front_lever","团身前水平","背/核心",["street"],"单杠","等长水平拉","front_lever","bodyweight");
  add("front_lever_raise","前水平举腿","背/核心",["street"],"单杠","肩伸展 / 核心","front_lever","bodyweight");
  add("planche_lean","俄挺前倾","肩/胸/核心",["street","home"],"自重","等长水平推","planche","bodyweight");
  add("tuck_planche","团身俄挺","肩/胸/核心",["street"],"双杠 / 地面","等长水平推","planche","bodyweight");
  add("skin_the_cat","Skin the Cat","背/肩/核心",["street"],"吊环 / 单杠","肩伸展 / 核心","gymnastic","bodyweight");
  add("human_flag_tuck","团身人体旗帜","核心/肩",["street"],"竖杆","抗侧屈 / 等长","gymnastic","bodyweight");

  // 居家体能
  add("burpee","波比跳","全身",["home","street"],"自重","全身体能","conditioning","bodyweight");
  add("mountain_climber","登山跑","腹/核心",["home"],"自重","核心 / 有氧","conditioning","bodyweight");
  add("bear_crawl","熊爬","全身/核心",["home","street"],"自重","爬行","conditioning","bodyweight");
  add("inchworm","毛毛虫爬","全身/核心",["home"],"自重","爬行 / 拉伸","conditioning","bodyweight");
  add("bodyweight_reverse_lunge","自重反向弓步","股四头/臀",["home"],"自重","弓步","lunge","bodyweight");
  add("bodyweight_step_up","自重台阶上步","股四头/臀",["home"],"箱凳 / 楼梯","单腿蹲","lunge","bodyweight");

  // 弹力带
  add("band_pushup","弹力带俯卧撑","胸/三头",["band","home"],"弹力带","水平推","pushup","band",[],["胸","三头"],{resistanceOptions:BAND_OPTIONS});
  add("band_chest_press","弹力带推胸","胸",["band","home"],"弹力带","水平推","press","band",[],["胸"],{resistanceOptions:BAND_OPTIONS});
  add("band_fly","弹力带夹胸","胸",["band","home"],"弹力带","水平夹胸","fly","band",[],["胸"],{resistanceOptions:BAND_OPTIONS});
  add("band_row","弹力带划船","背",["band","home"],"弹力带","水平拉","row","band",[],["背"],{resistanceOptions:BAND_OPTIONS});
  add("band_pulldown","弹力带高位下拉","背",["band","home"],"弹力带","垂直拉","pulldown","band",[],["背"],{resistanceOptions:BAND_OPTIONS});
  add("band_straight_arm_pulldown","弹力带直臂下压","背",["band","home"],"弹力带","肩伸展","pullover","band",[],["背"],{resistanceOptions:BAND_OPTIONS});
  add("band_face_pull","弹力带面拉","肩/后束",["band","home"],"弹力带","水平拉 / 外旋","face_pull","band",[],["后束"],{resistanceOptions:BAND_OPTIONS});
  add("band_lateral_raise","弹力带侧平举","肩",["band","home"],"弹力带","肩外展","raise","band",[],["中束"],{resistanceOptions:BAND_OPTIONS});
  add("band_front_raise","弹力带前平举","肩",["band","home"],"弹力带","肩屈曲","raise","band",[],["前束"],{resistanceOptions:BAND_OPTIONS});
  add("band_y_raise","弹力带 Y 举","肩",["band","home"],"弹力带","肩外展","raise","band",[],["肩"],{resistanceOptions:BAND_OPTIONS});
  add("band_overhead_press","弹力带推肩","肩",["band","home"],"弹力带","垂直推","shoulder_press","band",[],["肩"],{resistanceOptions:BAND_OPTIONS});
  add("band_biceps_curl","弹力带二头弯举","二头",["band","home"],"弹力带","肘屈","curl","band",[],["二头"],{resistanceOptions:BAND_OPTIONS});
  add("band_hammer_curl","弹力带锤式弯举","二头/肱肌",["band","home"],"弹力带","肘屈","curl","band",[],["二头","肱肌"],{resistanceOptions:BAND_OPTIONS});
  add("band_triceps_pushdown","弹力带三头下压","三头",["band","home"],"弹力带","肘伸","triceps","band",[],["三头"],{resistanceOptions:BAND_OPTIONS});
  add("band_overhead_triceps_extension","弹力带过顶臂屈伸","三头",["band","home"],"弹力带","肘伸","triceps","band",[],["三头"],{resistanceOptions:BAND_OPTIONS});
  add("band_squat","弹力带深蹲","股四头/臀",["band","home"],"弹力带","深蹲","squat","band",[],["股四头","臀"],{resistanceOptions:BAND_OPTIONS});
  add("band_rdl","弹力带罗马尼亚硬拉","腘绳肌/臀",["band","home"],"弹力带","髋铰链","hinge","band",[],["腘绳肌","臀"],{resistanceOptions:BAND_OPTIONS});
  add("band_good_morning","弹力带早安式","腘绳肌/臀",["band","home"],"弹力带","髋铰链","hinge","band",[],["腘绳肌","臀"],{resistanceOptions:BAND_OPTIONS});
  add("band_glute_bridge","弹力带臀桥","臀",["band","home"],"弹力带","髋伸","bridge","band",[],["臀"],{resistanceOptions:BAND_OPTIONS});
  add("band_hip_abduction","弹力带髋外展","臀",["band","home"],"环形弹力带","髋外展","abduction","band",[],["臀中肌"],{resistanceOptions:BAND_OPTIONS});
  add("band_lateral_walk","弹力带侧向走","臀",["band","home"],"环形弹力带","髋外展 / 步行","abduction","band",[],["臀中肌"],{resistanceOptions:BAND_OPTIONS});
  add("band_leg_curl","弹力带腿弯举","腘绳肌",["band","home"],"弹力带","膝屈","leg_curl","band",[],["腘绳肌"],{resistanceOptions:BAND_OPTIONS});

  // 壶铃
  add("kb_swing","壶铃摆动","臀/腘绳肌/核心",["kettlebell","home"],"壶铃","爆发髋伸","swing");
  add("kb_deadlift","壶铃硬拉","臀/腘绳肌",["kettlebell","home"],"壶铃","髋铰链","hinge");
  add("kb_goblet_squat","壶铃高脚杯深蹲","股四头/臀",["kettlebell","home"],"壶铃","深蹲","squat");
  add("kb_front_rack_squat","壶铃前架深蹲","股四头/臀",["kettlebell"],"双壶铃","深蹲","squat");
  add("kb_clean","壶铃翻举","全身",["kettlebell"],"壶铃","爆发髋伸 / 翻举","swing");
  add("kb_clean_press","壶铃翻举推举","全身/肩",["kettlebell"],"壶铃","翻举 + 垂直推","shoulder_press");
  add("kb_press","壶铃推举","肩",["kettlebell","home"],"壶铃","垂直推","shoulder_press");
  add("kb_push_press","壶铃借力推举","肩/腿",["kettlebell"],"壶铃","爆发垂直推","shoulder_press");
  add("kb_snatch","壶铃抓举","全身",["kettlebell"],"壶铃","爆发髋伸","swing");
  add("kb_row","壶铃划船","背",["kettlebell","home"],"壶铃","水平拉","row");
  add("kb_turkish_getup","土耳其起立","全身/核心",["kettlebell","home"],"壶铃","地面起立 / 稳定","getup");
  add("kb_windmill","壶铃风车","核心/肩",["kettlebell"],"壶铃","髋铰链 / 抗旋转","rotation");
  add("kb_front_rack_lunge","壶铃前架弓步","股四头/臀",["kettlebell"],"壶铃","弓步","lunge");

  // TRX / 悬吊
  add("trx_row","TRX 划船","背/二头",["suspension","home"],"TRX / 吊带","水平拉","row","bodyweight");
  add("trx_high_row","TRX 高位划船","背/后束",["suspension","home"],"TRX / 吊带","水平拉","row","bodyweight");
  add("trx_pushup","TRX 俯卧撑","胸/三头",["suspension","home"],"TRX / 吊带","水平推","pushup","bodyweight");
  add("trx_chest_fly","TRX 飞鸟","胸",["suspension","home"],"TRX / 吊带","水平夹胸","fly","bodyweight");
  add("trx_y_raise","TRX Y 举","肩",["suspension","home"],"TRX / 吊带","肩外展","raise","bodyweight");
  add("trx_biceps_curl","TRX 二头弯举","二头",["suspension","home"],"TRX / 吊带","肘屈","curl","bodyweight");
  add("trx_triceps_extension","TRX 三头伸展","三头",["suspension","home"],"TRX / 吊带","肘伸","triceps","bodyweight");
  add("trx_squat","TRX 辅助深蹲","股四头/臀",["suspension","home"],"TRX / 吊带","深蹲","squat","bodyweight");
  add("trx_split_squat","TRX 分腿蹲","股四头/臀",["suspension","home"],"TRX / 吊带","单腿蹲","lunge","bodyweight");
  add("trx_hamstring_curl","TRX 腿弯举","腘绳肌",["suspension","home"],"TRX / 吊带","膝屈","leg_curl","bodyweight");
  add("trx_fallout","TRX Fallout","腹/核心",["suspension","home"],"TRX / 吊带","抗伸展","core_rollout","bodyweight");
  add("trx_pike","TRX Pike","腹/核心",["suspension","home"],"TRX / 吊带","髋屈 / 核心","core_floor","bodyweight");

  // 药球 / 爆发力
  add("med_ball_slam","药球砸地","全身/核心",["medicine","home"],"药球","爆发屈髋 / 下砸","conditioning");
  add("med_ball_chest_pass","药球胸前传球","胸/三头",["medicine"],"药球 + 墙 / 伙伴","爆发水平推","press");
  add("med_ball_rotational_throw","药球旋转抛","腹/核心",["medicine"],"药球 + 墙","爆发旋转","rotation");
  add("med_ball_overhead_throw","药球过顶后抛","全身",["medicine"],"药球","爆发伸髋","conditioning");
  add("box_jump","跳箱","股四头/臀",["medicine","gym_free"],"跳箱","下肢爆发","conditioning","bodyweight");
  add("broad_jump","立定跳远","股四头/臀",["medicine","street"],"自重","下肢爆发","conditioning","bodyweight");

  const sceneLabel=id=>SCENES[id]?.label||SCENES.other.label;
  const primaryScene=ex=>(ex?.scenes?.[0]||"other");

  const art={
    press:'<circle cx="12" cy="6" r="2"/><path d="M12 8v6M8 10l4 2 4-2M8 16h8M6 16h12M7 19h10"/>',
    machine_press:'<rect x="3" y="4" width="3" height="16" rx="1"/><circle cx="12" cy="7" r="2"/><path d="M12 9v5M12 11l6-2M12 11 7 2M9 16h6M18 6v9"/>',
    fly:'<circle cx="12" cy="6" r="2"/><path d="M12 8v7M4 10c3 0 5 1 8 3 3-2 5-3 8-3M8 17h8"/>',
    pullover:'<circle cx="11" cy="7" r="2"/><path d="M11 9v6M11 10c3-3 5-4 8-4M8 17h8"/>',
    row:'<circle cx="8" cy="8" r="2"/><path d="M8 10l3 4 5-1M5 16h10M16 13l4-2M17 9h4"/>',
    machine_row:'<rect x="18" y="4" width="3" height="16" rx="1"/><circle cx="8" cy="8" r="2"/><path d="M8 10l3 4 5-1M4 17h10M16 13l3-2"/>',
    pulldown:'<path d="M5 4h14M7 4v3M17 4v3"/><circle cx="12" cy="9" r="2"/><path d="M12 11v6M7 8l5 4 5-4M9 20h6"/>',
    shoulder_press:'<circle cx="12" cy="8" r="2"/><path d="M12 10v6M8 11l-2-5M16 11l2-5M5 5h3M16 5h3M9 19h6"/>',
    raise:'<circle cx="12" cy="7" r="2"/><path d="M12 9v7M4 10h5M15 10h5M9 19h6"/>',
    reverse_fly:'<circle cx="12" cy="7" r="2"/><path d="M12 9l-2 6M10 11 5 8M10 11l6-2M7 18h7"/>',
    face_pull:'<circle cx="8" cy="8" r="2"/><path d="M8 10v6M8 11l5-2M13 9l4 1M5 19h7"/>',
    shrug:'<circle cx="12" cy="6" r="2"/><path d="M12 8v8M7 10l2-2M17 10l-2-2M7 19h10"/>',
    curl:'<circle cx="12" cy="6" r="2"/><path d="M12 8v8M8 10l-2 4 3-1M16 10l2 4-3-1M9 19h6"/>',
    triceps:'<circle cx="12" cy="6" r="2"/><path d="M12 8v8M8 9l-2-3M16 9l2-3M6 6v7M18 6v7M9 19h6"/>',
    squat:'<circle cx="12" cy="6" r="2"/><path d="M12 8l-1 6M11 14l-4 3M11 14l5 3M5 18h4M15 18h4M7 9h10"/>',
    leg_press:'<circle cx="8" cy="7" r="2"/><path d="M8 9l3 5M11 14l5-3M16 11l4-2M4 18h8M19 5v11"/>',
    lunge:'<circle cx="12" cy="5" r="2"/><path d="M12 7v7M12 12l-5 5M12 13l6 4M4 18h6M16 18h5"/>',
    hinge:'<circle cx="9" cy="6" r="2"/><path d="M9 8l5 5M14 13l-1 6M14 13l5 4M4 18h16M5 10h8"/>',
    leg_extension:'<circle cx="8" cy="7" r="2"/><path d="M8 9v5M8 14h5l5-2M4 18h9M18 5v12"/>',
    leg_curl:'<circle cx="8" cy="7" r="2"/><path d="M8 9v5M8 14h6l3 3M4 18h8M18 5v12"/>',
    bridge:'<circle cx="5" cy="12" r="2"/><path d="M7 12h5l4-4M12 12l4 4M3 17h17"/>',
    kickback:'<circle cx="8" cy="6" r="2"/><path d="M8 8v7M8 12l6-1M14 11l5-3M5 18h7"/>',
    abduction:'<circle cx="12" cy="5" r="2"/><path d="M12 7v7M12 14l-5 4M12 14l6 4M5 19h4M16 19h4"/>',
    adduction:'<circle cx="12" cy="5" r="2"/><path d="M12 7v7M12 14l-2 5M12 14l2 5M8 20h3M13 20h3"/>',
    calf:'<circle cx="12" cy="5" r="2"/><path d="M12 7v8M12 15l-3 4M12 15l3 4M8 20h3M13 20h4M18 18h3"/>',
    pullup:'<path d="M4 4h16"/><circle cx="12" cy="8" r="2"/><path d="M12 10v6M7 5l5 5 5-5M9 20h6"/>',
    pushup:'<circle cx="6" cy="11" r="2"/><path d="M8 11l7 3M15 14l5 2M8 12l-3 4M12 13l-2 4M3 18h18"/>',
    dip:'<path d="M5 9h5M14 9h5"/><circle cx="12" cy="6" r="2"/><path d="M12 8v7M8 10l4 2 4-2M10 19h4"/>',
    core_hang:'<path d="M5 4h14"/><circle cx="12" cy="8" r="2"/><path d="M12 10v5M7 5l5 5 5-5M12 15l-4 3M12 15l4 3"/>',
    core_crunch:'<circle cx="6" cy="12" r="2"/><path d="M8 12c4-4 7-3 9 1M17 13l3 3M3 18h18"/>',
    core_rollout:'<circle cx="7" cy="10" r="2"/><path d="M9 10l5 4M14 14l5 1M6 13l-3 4M18 17h3"/><circle cx="20" cy="16" r="1.5"/>',
    plank:'<circle cx="6" cy="10" r="2"/><path d="M8 10l8 4M16 14h5M8 11l-3 5M3 17h18"/>',
    core_floor:'<circle cx="6" cy="14" r="2"/><path d="M8 14l5-3M13 11l6 2M10 13l2 5M3 19h18"/>',
    rotation:'<circle cx="12" cy="5" r="2"/><path d="M12 7v8M7 10l5 2 5-3M9 19h6"/><path d="M18 6c2 1 3 2 3 4"/>',
    carry:'<circle cx="12" cy="5" r="2"/><path d="M12 7v8M8 10v5M16 10v5M6 16h4M14 16h4M9 20h6"/>',
    muscle_up:'<path d="M4 8h16"/><circle cx="12" cy="5" r="2"/><path d="M12 7v7M8 9l4 2 4-2M9 18h6"/>',
    handstand:'<circle cx="12" cy="19" r="2"/><path d="M12 17V9M7 14l5-3 5 3M9 5h6"/>',
    l_sit:'<circle cx="7" cy="8" r="2"/><path d="M7 10v5M7 13h8M15 13h5M4 17h8"/>',
    front_lever:'<path d="M4 4h16"/><circle cx="7" cy="8" r="2"/><path d="M9 8h9M8 7l4-3M8 9l4-5"/>',
    planche:'<circle cx="6" cy="12" r="2"/><path d="M8 12h9M9 13l-4 4M12 13l-3 4M17 12h4"/>',
    gymnastic:'<path d="M5 4h14"/><circle cx="12" cy="8" r="2"/><path d="M12 10l4 5M12 10l-4 5M8 5l4 5 4-5"/>',
    conditioning:'<circle cx="12" cy="5" r="2"/><path d="M12 7l-2 6M10 13l-5 5M10 13l7 4M6 9l6 2 5-3"/>',
    swing:'<circle cx="12" cy="5" r="2"/><path d="M12 7v7M9 10l3 3 4-4M10 18h4"/><circle cx="18" cy="8" r="2"/>',
    getup:'<circle cx="7" cy="14" r="2"/><path d="M9 14l4-5M13 9l4-3M13 9l5 3M9 16l3 3M3 20h16"/>'
  };
  const fallback=art.conditioning;

  function renderIllustration(ex,size="normal"){
    const key=ex?.illustration||"conditioning",body=art[key]||fallback;
    const cls=size==="small"?" exercise-illustration-small":"";
    return '<span class="exercise-illustration'+cls+'" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round">'+body+'</svg></span>';
  }

  window.EXERCISE_CATALOG=R;
  window.EXERCISE_SCENES=SCENES;
  window.exerciseSceneLabel=sceneLabel;
  window.exercisePrimaryScene=primaryScene;
  window.renderExerciseIllustration=renderIllustration;
})();