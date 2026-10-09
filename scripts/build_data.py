import pandas as pd,json
from pathlib import Path
p=Path(__file__).resolve().parents[1]
d=pd.read_csv(p/'public/data/cleaned_dataset.csv')
cols=['arrival_year','arrival_month','booking_status','market_segment_type','room_type_reserved','no_of_special_requests','lead_time_category','stay_category','price_category','family_trip','meal_park','repeated_guest','weekend_group','avg_price_per_room','lead_time','total_stay_nights','no_of_weekend_nights','no_of_week_nights','type_of_meal_plan','required_car_parking_space']
records=[]
for row in d[cols].itertuples(index=False,name=None):
 records.append([int(v) if isinstance(v,(int,float)) and float(v).is_integer() else round(float(v),2) if isinstance(v,float) and not pd.isna(v) else None if pd.isna(v) else v for v in row])
(p/'public/data/records.json').write_text(json.dumps({'columns':cols,'records':records},separators=(',',':')))
metadata={'rawRows':len(pd.read_csv(p/'public/data/raw_dataset.csv')),'cleanRows':len(d),'removedRows':len(pd.read_csv(p/'public/data/raw_dataset.csv'))-len(d),'columns':cols,'totalFields':len(d.columns),'years':sorted(d.arrival_year.unique().tolist()),'nulls':{k:int(v) for k,v in d.isna().sum().items() if v}, 'categories':{c:sorted(str(v) for v in d[c].dropna().unique()) for c in ['market_segment_type','room_type_reserved','lead_time_category','stay_category','price_category','weekend_group']}}
(p/'public/data/metadata.json').write_text(json.dumps(metadata,indent=2))
print(metadata)
